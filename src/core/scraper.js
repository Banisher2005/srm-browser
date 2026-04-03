// SRM Desk — Core Scraper (Electron Port)
// Original logic preserved

export async function scrapeAll() {
  var PAGES = {
    WELCOME: "#WELCOME",
    ATT_MARKS: "#Page:My_Attendance",
    TIMETABLE: "#Page:My_Time_Table_2023_24",
  };

  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  function getAllText() {
    var parts = [document.body.innerText || ""];
    Array.from(document.querySelectorAll("iframe")).forEach(function (f) {
      try {
        var doc = f.contentDocument || f.contentWindow.document;
        if (doc && doc.body) parts.push(doc.body.innerText || "");
      } catch (e) {}
    });
    return parts.join("\n");
  }

  function getAllTables() {
    var tables = Array.from(document.querySelectorAll("table"));
    Array.from(document.querySelectorAll("iframe")).forEach(function (f) {
      try {
        var doc = f.contentDocument || f.contentWindow.document;
        if (doc)
          tables = tables.concat(Array.from(doc.querySelectorAll("table")));
      } catch (e) {}
    });
    return tables;
  }

  async function goTo(hash, minLen) {
    minLen = minLen || 5000;
    window.location.hash = hash;
    await sleep(1500);
    var deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      await sleep(800);
      var text = getAllText();
      if (text.length >= minLen) {
        await sleep(2000);
        return getAllText();
      }
    }
    return getAllText();
  }

  function detectBatch(text) {
    var patterns = [
      /^Batch\s*:\s*(\d+)\s*$/im,
      /Batch\s*:\s*(\d+)/i,
      /Unified_Time_Table_\d{4}[_-][Bb]atch[_-](\d+)/i,
      /\bBatch\s+(\d+)\b/i,
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = text.match(patterns[i]);
      if (m && m[1]) {
        var n = parseInt(m[1]);
        if (n >= 1 && n <= 10) return n;
      }
    }
    return null;
  }

  function slotGridCandidates(batchNum) {
    return [
      "#Page:Unified_Time_Table_2025_Batch_" + batchNum,
      "#Page:Unified_Time_Table_2025_batch_" + batchNum,
      "#Page:Unified_Time_Table_2024_Batch_" + batchNum,
      "#Page:Unified_Time_Table_2024_batch_" + batchNum,
      "#Page:Unified_Time_Table_Batch_" + batchNum,
    ];
  }

  function parseAttendance(text) {
    var att = [];
    var HEADER = "Hours Conducted\tHours Absent\tAttn %";
    var idx = text.indexOf(HEADER);
    if (idx === -1) return att;

    var after = text.slice(idx + HEADER.length);
    var endIdx = after.indexOf(
      "Course Code\tCourse Type\tTest Performance"
    );
    if (endIdx === -1) endIdx = after.indexOf("Internal Marks Detail");
    var section = endIdx > 0 ? after.slice(0, endIdx) : after.slice(0, 5000);

    var lines = section
      .split("\n")
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);

    var i = 0;
    while (i < lines.length) {
      var codeMatch = lines[i].match(
        /^(\d{2}[A-Z]{2,3}\d{3}[A-Z0-9]*)$/
      );
      if (!codeMatch) {
        i++;
        continue;
      }
      var code = codeMatch[1];
      i++;
      if (i >= lines.length) break;

      var dataLine = lines[i];
      var parts = dataLine.split("\t");

      if (
        parts.length >= 8 &&
        /^(Regular|Elective|Lateral|Audit|Mandatory)$/i.test(parts[0])
      ) {
        var conducted = parseInt(parts[6]) || 0;
        var absent = parseInt(parts[7]) || 0;
        var attn = parseFloat(parts[8]) || 0;
        if (conducted > 0) {
          att.push({
            courseCode: code,
            courseTitle: parts[1] || "Unknown",
            type: parts[2] || "Theory",
            faculty: parts[3] || "",
            slot: parts[4] || "",
            room: parts[5] || "",
            attended: conducted - absent,
            total: conducted,
            percentage: attn,
          });
        }
      }
      i++;
    }
    return att;
  }

  function parseMarks(codeToTitle) {
    var marks = [];
    var target = null;

    // Find the marks table — look for "Course Code" + "Course Type" in header
    // Be lenient about cell count and column ordering
    getAllTables().forEach(function (table) {
      if (target) return;
      var rows = Array.from(table.querySelectorAll("tr"));
      for (var ri = 0; ri < Math.min(rows.length, 5); ri++) {
        var cells = Array.from(rows[ri].querySelectorAll("th,td")).map(function (c) {
          return c.innerText.trim();
        });
        var hasCourseCode = cells.indexOf("Course Code") !== -1;
        var hasCourseType = cells.indexOf("Course Type") !== -1;
        // Must have both; must NOT look like the attendance table (which has "Hours Conducted")
        var hasHours = cells.indexOf("Hours Conducted") !== -1;
        if (hasCourseCode && hasCourseType && !hasHours) {
          target = table;
          break;
        }
      }
    });

    if (!target) return marks;

    var rows = Array.from(target.querySelectorAll("tr"));
    var hIdx = -1;
    var codeCol = -1, typeCol = -1;

    for (var ri = 0; ri < rows.length; ri++) {
      var c = Array.from(rows[ri].querySelectorAll("th,td")).map(function (x) {
        return x.innerText.trim();
      });
      if (c.indexOf("Course Code") !== -1 && c.indexOf("Course Type") !== -1) {
        hIdx    = ri;
        codeCol = c.indexOf("Course Code");
        typeCol = c.indexOf("Course Type");
        break;
      }
    }

    if (hIdx < 0) return marks;

    var seenCodes = {};
    for (var ri2 = hIdx + 1; ri2 < rows.length; ri2++) {
      var tds = Array.from(rows[ri2].querySelectorAll("td"));
      if (!tds.length) continue;

      var code2 = tds[codeCol] ? tds[codeCol].innerText.trim() : "";
      if (!code2.match(/^\d{2}[A-Z]/)) continue;

      var type2 = tds[typeCol] ? tds[typeCol].innerText.trim() : "";
      var key = code2 + "|" + type2;
      if (seenCodes[key]) continue;
      seenCodes[key] = true;

      var tests = [];
      var seenTests = {};

      // Scan ALL cells (not just after col 2) for embedded test score tables
      for (var ci = 0; ci < tds.length; ci++) {
        // Skip the code/type columns themselves
        if (ci === codeCol || ci === typeCol) continue;

        var cellText = tds[ci].innerText.trim();

        // Method 1: sub-tables inside the cell
        var subTables = tds[ci].querySelectorAll("table");
        if (subTables.length > 0) {
          Array.from(subTables).forEach(function (st) {
            var lines = st.innerText.trim().split("\n")
              .map(function (l) { return l.trim(); })
              .filter(Boolean);

            // Pattern: header line "TestName/MaxMark" then score line
            for (var li = 0; li < lines.length - 1; li++) {
              var hm = lines[li].match(/^(.+?)\/(\d+\.?\d*)$/);
              if (hm) {
                var tname = hm[1].trim();
                if (!seenTests[tname]) {
                  seenTests[tname] = true;
                  // Next non-empty line is the score (may be "AB" for absent)
                  var scoreRaw = lines[li + 1];
                  var scored = scoreRaw === "AB" ? 0 : (parseFloat(scoreRaw) || 0);
                  tests.push({ testName: tname, scored: scored, maximum: parseFloat(hm[2]) || 100 });
                }
              }
            }
          });
        } else if (cellText) {
          // Method 2: plain cell text like "Cycle Test 1/50\n38" or "CT1/50\n38.5"
          var lines2 = cellText.split("\n").map(function(l){return l.trim();}).filter(Boolean);
          for (var li2 = 0; li2 < lines2.length - 1; li2++) {
            var hm2 = lines2[li2].match(/^(.+?)\/(\d+\.?\d*)$/);
            if (hm2) {
              var tname2 = hm2[1].trim();
              if (!seenTests[tname2]) {
                seenTests[tname2] = true;
                var scoreRaw2 = lines2[li2 + 1];
                var scored2 = scoreRaw2 === "AB" ? 0 : (parseFloat(scoreRaw2) || 0);
                tests.push({ testName: tname2, scored: scored2, maximum: parseFloat(hm2[2]) || 100 });
              }
            }
          }
        }
      }

      marks.push({
        courseCode: code2,
        courseTitle: codeToTitle[code2] || code2,
        courseType: type2,
        testPerformance: tests,
      });
    }

    return marks;
  }

  function parseTimetable(text) {
    var tt = [],
      seen = {};
    var idx = text.indexOf("S.No\t");
    if (idx === -1) return tt;

    text
      .slice(idx)
      .split("\n")
      .slice(1)
      .forEach(function (line) {
        var p = line.trim().split("\t");
        if (p.length < 9 || !/^\d+$/.test(p[0].trim())) return;
        var slot = p[8].replace(/-+$/, "").trim();
        var code = p[1].trim();
        var key = slot + "|" + code;
        if (seen[key]) return;
        seen[key] = true;
        tt.push({
          slot: slot,
          courseTitle: p[2].trim(),
          courseCode: code,
          faculty: p[7].trim(),
          room: p[9] ? p[9].trim() : "",
        });
      });

    return tt;
  }

  function parseSlotGrid() {
    var grid = {};
    getAllTables().forEach(function (table) {
      var rows = Array.from(table.querySelectorAll("tr")).map(function (tr) {
        return Array.from(tr.querySelectorAll("th,td")).map(function (c) {
          return c.innerText.trim();
        });
      });

      var fi = -1;
      for (var ri = 0; ri < rows.length; ri++) {
        if (
          rows[ri][0] === "FROM" ||
          (rows[ri].length > 3 &&
            rows[ri][1] &&
            rows[ri][1].match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/))
        ) {
          fi = ri;
          break;
        }
      }
      if (fi < 0) return;

      var ct = rows[fi].map(function (c) {
        var m = c.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
        return m ? { start: m[1], end: m[2] } : null;
      });

      for (var ri2 = fi + 1; ri2 < rows.length; ri2++) {
        var cells = rows[ri2];
        var dm = cells[0] && cells[0].match(/^Day\s*(\d+)$/i);
        if (!dm) continue;

        var dk = "Day " + dm[1];
        if (!grid[dk]) grid[dk] = {};

        for (var ci = 1; ci < cells.length; ci++) {
          if (!cells[ci] || cells[ci] === "-") continue;
          var t = ct[ci];
          if (!t) continue;

          cells[ci].split("/").forEach(function (code) {
            code = code.trim();
            if (!code || code.toUpperCase() === "X") return;
            if (!grid[dk][code])
              grid[dk][code] = { start: t.start, end: t.end };
          });
        }
      }
    });

    return grid;
  }

  var saved = {
    info: { scrapedAt: new Date().toISOString() },
    todayDayOrder: null,
    batchNumber: null,
    attendance: [],
    marks: [],
    timetable: [],
    slotGrid: {},
    _debug: {},
  };

  var wt = await goTo(PAGES.WELCOME, 5000);
  var dm = wt.match(/Day\s*Order\s*[:\-]?\s*(\d+)/i);
  saved.todayDayOrder = dm ? "Day " + dm[1] : null;

  var attText = await goTo(PAGES.ATT_MARKS, 12000);
  if (attText.includes("Hours Conducted\tHours Absent\tAttn %")) {
    saved.attendance = parseAttendance(attText);
  }

  var codeToTitle = {};
  saved.attendance.forEach(function (a) {
    codeToTitle[a.courseCode] = a.courseTitle;
  });

  saved.marks = parseMarks(codeToTitle);

  var ttText = await goTo(PAGES.TIMETABLE, 5000);
  saved.timetable = parseTimetable(ttText);

  var batchNum = detectBatch(ttText) || detectBatch(getAllText()) || 1;
  saved.batchNumber = batchNum;

  var candidates = slotGridCandidates(batchNum);
  for (var i = 0; i < candidates.length; i++) {
    await goTo(candidates[i], 5000);
    await sleep(500);
    saved.slotGrid = parseSlotGrid();
    if (Object.keys(saved.slotGrid).length > 0) break;
  }

  return saved;
}
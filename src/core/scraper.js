export async function scrapeAll() {
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getAllText() {
    let parts = [document.body.innerText || ""];

    document.querySelectorAll("iframe").forEach((frame) => {
      try {
        const doc = frame.contentDocument || frame.contentWindow.document;
        if (doc?.body) {
          parts.push(doc.body.innerText || "");
        }
      } catch {}
    });

    return parts.join("\n");
  }

  async function goTo(hash, minLen = 4000) {
    window.location.hash = hash;

    // let Zoho shell switch routes
    await sleep(1800);

    const deadline = Date.now() + 20000;

    while (Date.now() < deadline) {
      await sleep(700);

      const text = getAllText();

      // enough DOM loaded
      if (text.length > minLen) {
        await sleep(1200);
        return text;
      }
    }

    return getAllText();
  }

  function parseAttendance(text) {
    const att = [];
    const HEADER = "Hours Conducted\tHours Absent\tAttn %";
    const idx = text.indexOf(HEADER);

    if (idx === -1) return att;

    const after = text.slice(idx + HEADER.length);
    const lines = after
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let i = 0;

    while (i < lines.length) {
      const codeMatch = lines[i].match(
        /^(\d{2}[A-Z]{2,3}\d{3}[A-Z0-9]*)$/
      );

      if (!codeMatch) {
        i++;
        continue;
      }

      const code = codeMatch[1];
      i++;

      if (i >= lines.length) break;

      const parts = lines[i].split("\t");

      if (parts.length >= 9) {
        const conducted = parseInt(parts[6]) || 0;
        const absent = parseInt(parts[7]) || 0;
        const percentage = parseFloat(parts[8]) || 0;

        att.push({
          courseCode: code,
          courseTitle: parts[1] || "Unknown",
          attended: conducted - absent,
          total: conducted,
          percentage,
        });
      }

      i++;
    }

    return att;
  }

  // 🚀 navigate using hash like original extension
  const text = await goTo("#Page:My_Attendance", 10000);

  const attendance = parseAttendance(text);

  const totalAtt = attendance.reduce((s, r) => s + r.attended, 0);
  const totalCls = attendance.reduce((s, r) => s + r.total, 0);

  const overallPct = totalCls
    ? Math.round((totalAtt / totalCls) * 100)
    : 0;

  const totalSkip = attendance.reduce((sum, row) => {
    return (
      sum +
      Math.max(
        0,
        Math.floor((row.attended - row.total * 0.75) / 0.75)
      )
    );
  }, 0);

  return {
    attendance,
    overallPct,
    totalSkip,
  };
}
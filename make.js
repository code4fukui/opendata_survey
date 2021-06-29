import { CSV } from "https://js.sabae.cc/CSV.js";

const getNamesFrom2Line = (csv) => {
  console.log(csv[0]);
  console.log(csv[1]);

  const res = [];
  let options = null;
  for (let i = 0; i < csv[0].length; i++) {
    const name = csv[0][i].trim();
    const val = csv[1][i].trim();
    if (name) {
      if (!val) {
        res.push({ name, type: "free" });
      } else {
        options = [];
        const type = name.indexOf("全て選択") >= 0 || name.indexOf("すべて選択") >= 0 || name.indexOf("つまで選択") >= 0 ? "multiple" : "single";
        const o = { name, type, options };
        res.push(o);
        options.push(val);
      }
    } else {
      options.push(val);
    }
  }
  console.log(res);
  return res;
};

const makeMarkdown = (title, names) => {
  const s = [];
  s.push("# " + title);
  s.push("");
  for (const o of names) {
    const n = o.name;
    const ss = n.trim().split("\n");
    s.push("## " + ss[0]);
    s.push("");

    let idx = 1;
    while (ss[idx] == "" && idx < ss.length) {
      idx++;
    }
    let flg = idx < ss.length;
    if (flg) {
      for (let i = idx; i < ss.length; i++) {
        s.push(ss[i] + "  ");
      }
    }
    if (o.options) {
      if (flg) {
        s.push("");
      }
      for (let i = 0; i < o.options.length; i++) {
        s.push((i + 1) + ". " + o.options[i]);
      }
      s.push("");
    }
  }
  return s.join("\n");
};

const normalizeAfter2Line = (csv, names) => {
  const csv2 = [];
  csv2.push(names.map(n => n.options ? JSON.stringify([n.name, n.options]) : n.name));
  for (let i = 2; i < csv.length; i++) {
    const data = [];
    const c = csv[i];
    let idx = 0;
    for (const n of names) {
      if (!n.options) {
        data.push(c[idx++]);
      } else {
        let val = "";
        for (let i = 0; i < n.options.length; i++) {
          const v = c[idx++];
          if (v != "" && v != "○") {
            throw new Error("illegal value", v);
          }
          val += v == "" ? "-" : "v";
        }
        data.push(val);
      }
    }
    if (data.length != names.length) {
      throw new Error("illegal data line");
    }
    //console.log(data, data.length, names.length);
    csv2.push(data);
  }
  return csv2;
};

const normalizeAfter2Line2 = (csv, names) => {
  const csv2 = [];
  const header = [];
  for (const n of names) {
    if (!n.options) {
      header.push(n.name);
    } else {
      const no = n.name.match(/^\[(.+)\]/)[1];
      if (!no) {
        throw new Error("illegal name", n.name);
      }
      for (let i = 0; i < n.options.length; i++) {
        header.push("[" + no + "]" + n.options[i].trim());
      }
    }
  }
  csv2.push(header);
  for (let i = 2; i < csv.length; i++) {
    const data = [];
    const c = csv[i];
    let idx = 0;
    for (const n of names) {
      if (!n.options) {
        data.push(c[idx++]);
      } else {
        let val = "";
        for (let i = 0; i < n.options.length; i++) {
          const v = c[idx++];
          if (v != "" && v != "○") {
            throw new Error("illegal value", v);
          }
          if (c[2] == "提出済") {
            data.push(v == "" ? 0 : 1);
          } else {
            data.push("");
          }
        }
      }
    }
    if (data.length != header.length) {
      throw new Error("illegal data line");
    }
    //console.log(data, data.length, names.length);
    csv2.push(data);
  }
  return csv2;
};

const cutCheckDigit = (csv) => {
  for (let i = 1; i < csv.length; i++) {
    const v = csv[i][0];
    if (v.length == 6) {
      csv[i][0] = v.substring(0, 5);
    }
  }
  return csv;
};

const namesToCSV = (names) => {
  const vals = names.map(n => {
    if (!n.options) {
      return [n.name, n.type];
    } else {
      return [n.name, n.type, n.options.length, ...n.options];
    }
  });
  let max = 0;
  for (const v of vals) {
    if (v[2] > max) {
      max = v[2];
    }
  }
  const header = [];
  header.push("question");
  header.push("type");
  header.push("n_answers");
  for (let i = 0; i < max; i++) {
    header.push("answer_" + (i + 1));
  }
  return [header, ...vals];
};

const normalizeAfter2Line3 = (csv, names) => {
  const csv2 = [];
  const header = [];
  for (const n of names) {
    if (!n.options) {
      header.push(n.name);
    } else {
      const no = n.name.match(/^\[(.+)\]/)[1];
      if (!no) {
        throw new Error("illegal name", n.name);
      }
      if (n.type == "multiple") {
        for (let i = 0; i < n.options.length; i++) {
          header.push("[" + no + "]" + n.options[i].trim());
        }
      } else if (n.type == "single") {
        header.push(n.name.split("\n")[0]);
      } else {
        throw new Error("unknown type", n.type);
      }
    }
  }
  csv2.push(header);
  for (let i = 2; i < csv.length; i++) {
    const data = [];
    const c = csv[i];
    let idx = 0;
    for (const n of names) {
      if (!n.options) {
        data.push(c[idx++]);
      } else {
        if (n.type == "multiple") {
          let val = "";
          for (let i = 0; i < n.options.length; i++) {
            const v = c[idx++];
            if (v != "" && v != "○") {
              throw new Error("illegal value", v);
            }
            if (c[2] == "提出済") {
              data.push(v == "" ? 0 : 1);
            } else {
              data.push("");
            }
          }
        } else {
          let val = null;
          for (let i = 0; i < n.options.length; i++) {
            const v = c[idx++];
            if (v != "" && v != "○") {
              throw new Error("illegal value", v);
            }
            if (v == "○") {
              if (val) {
                console.log(n.name, c);
                throw new Error("must be single");
              }
              val = n.options[i];
            }
          }
          if (c[2] == "提出済") {
            data.push(val);
          } else {
            data.push("");
          }
        }
      }
    }
    if (data.length != header.length) {
      throw new Error("illegal data line");
    }
    //console.log(data, data.length, names.length);
    csv2.push(data);
  }
  return csv2;
};

const csv = await CSV.fetch("r2_survey_answers.csv");
cutCheckDigit(csv);
const names = getNamesFrom2Line(csv);
const md = makeMarkdown("オープンデータ自治体アンケート", names);
Deno.writeTextFile("r2_survey_questions.md", md);
Deno.writeTextFile("r2_survey_questions.csv", CSV.encode(namesToCSV(names)));

const csv2 = normalizeAfter2Line(csv, names);
Deno.writeTextFile("r2_survey_answers_parsed.csv", CSV.encode(csv2));

const csv3 = normalizeAfter2Line2(csv, names);
Deno.writeTextFile("r2_survey_answers_seperate.csv", CSV.encode(csv3));

const csv4 = normalizeAfter2Line3(csv, names);
Deno.writeTextFile("r2_survey_answers_simple.csv", CSV.encode(csv4));

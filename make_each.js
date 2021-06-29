import { CSV } from "https://js.sabae.cc/CSV.js";

const data = await CSV.fetch("r2_survey_answers_simple.csv");
const q = CSV.toJSON(await CSV.fetch("r2_survey_questions.csv"));
console.log(q)

const makeMarkdown = (data, questions) => {
  const s = [];
  const title = data[1] + "(" + data[0] + ")のオープンデータアンケート回答";
  s.push("# " + title);
  s.push("");
  let idx = 0;
  for (const q of questions) {
    const sq = q.question.split("\n")[0];
    console.log(sq, data[sq]);
    s.push("## " + q.question);
    s.push("");
    if (q.type == "multiple") {
      for (let i = 0; i < q.n_answers; i++) {
        s.push("- " + (data[idx++] == "1" ? "○" : "✗") + " " + q["answer_" + (i + 1)]);
      }
      s.push("");
    } else if (q.type == "single") {
      const d = data[idx++];
      for (let i = 0; i < q.n_answers; i++) {
        s.push("- " + (d == q["answer_" + (i + 1)] ? "○" : "　") + " " + q["answer_" + (i + 1)]);
      }
      s.push("");
    } else {
      s.push(data[idx++]);
      s.push("");
    }
  }
  return s.join("\n");
};

const list = [];
list.push("# オープンデータアンケート一覧");
list.push("");
for (let i = 1; i < data.length; i++) {
  const d = data[i];
  //console.log(d);
  const md = makeMarkdown(d, q);
  console.log(md);
  const fn = d[0] + ".md";
  Deno.writeTextFile("md/" + fn, md);
  const name = d[1] + "(" + d[0] + ")";
  list.push(`- [${name}](${fn})`);
  //break;
}
Deno.writeTextFile("md/README.md", list.join("\n"));

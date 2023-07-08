require("dotenv").config();
const fs = require("fs");
const request = require("undici").request;
const { format, parseISO } = require("date-fns");

const DATE_FORMAT = "LLLL dd, yyyy";
const now = new Date().toLocaleString("en", { timeZone: "UTC" });

const head = `# PHP Web Frameworks
A list of popular GitHub projects related to PHP web framework (ranked by stars)\n

| Framework | Stars | Forks | Open Issues | Description | Last Update | License |
| --------- | ----- | ----- | ----------- | ----------- | ----------- | ------- |
`;
const tail = "*Last Update*: ";
const warning = "⚠️ No longer maintained ⚠️";

const accessToken = process.env.TOKEN;

const repos = [];

const options = {
  maxRedirections: 15,
  headers: {
    Authorization: `token ${accessToken}`,
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
    accept: "application/vnd.github.v3+json",
  },
};

const getJSON = async (url) => {
  return (await request(url, options)).body.json();
};

const getBadge = (type, repo) =>
  `![${type}](https://img.shields.io/github/${type}/${repo}?color=blue)`;

Promise.all(
  require("./list.json").map(async (framework) => {
    try {
      repos.push(await getJSON(`https://api.github.com/repos/${framework}`));
    } catch (error) {
      console.error(error);
    }
  }),
).then(() => {
  if (repos.length === 0) {
    return;
  }

  let readme = head;
  repos
    .sort((a, b) => a.stargazers_count - b.stargazers_count)
    .reverse()
    .map((repo) => {
      readme += `| [${repo.full_name.toLowerCase()}](${repo.html_url}) | ${getBadge(
        "stars",
        repo.full_name,
      )} | ${getBadge("forks", repo.full_name)} | ${getBadge(
        "issues",
        repo.full_name,
      )} | ${
        (repo.archived ? warning + " " : "") + repo.description
      } | ${getBadge("last-commit", repo.full_name)} | ${getBadge(
        "license",
        repo.full_name,
      )} | \n`;
    });
  readme += `\n${tail}${format(
    new Date(now),
    "'UTC' HH:mm" + ", " + DATE_FORMAT,
  )}`;
  fs.writeFileSync("README.MD", readme);
});

const fs = require("fs");

const walkSync = function (dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function (file) {
    if (fs.statSync(dir + file).isDirectory()) {
      filelist = walkSync(dir + file + "/", filelist);
    } else {
      filelist.push(dir + file);
    }
  });
  return filelist;
};

const files = walkSync("src/components/lesson/canonical/renderers/", []);

files.forEach((file) => {
  if (file.endsWith(".tsx") || file.endsWith(".ts")) {
    let content = fs.readFileSync(file, "utf-8");

    // Some manual replacements to avoid breaking things
    content = content.replace(/activity\.hints/g, "activity.feedback?.hints");

    fs.writeFileSync(file, content);
  }
});

console.log("Done");

import postcss from "postcss";

function webFont(families, value) {
  return value
    .split(",")
    .filter(el => families.filter(fam => el.indexOf(fam) !== -1)[0])[0];
}

export default postcss.plugin("fonts-loaded-class", options => {
  return css => {
    options = options || {};
    const className = options.className || "wf-loaded";

    const insertions = [];

    css.walkRules((rule, index) => {
      rule.walkDecls(decl => {
        if (
          decl.prop === "font-family" &&
          webFont(options.families, decl.value)
        ) {
          rule.removeChild(decl);
          insertions.push({ rule, decl, index });
        }
      });
    });

    insertions.forEach(({ rule, decl }) => {
      const newRule = postcss.rule({
        selector: rule.selector
          .split(",")
          .map(
            part =>
              part.trim() === "html"
                ? `html.${className}`
                : `.${className} ${part}`
          )
          .join(",")
      });
      newRule.append(decl);
      rule.parent.insertAfter(rule, newRule);
    });
  };
});

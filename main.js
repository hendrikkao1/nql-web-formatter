const Parser = window.TreeSitter;

await Parser.init();

const Nql = await Parser.Language.load("./libs/tree-sitter-nql.wasm");

const parser = new Parser();

parser.setLanguage(Nql);

const nqlQueryInputEl = document.querySelector('[data-js-id="nql-query"]');

const formatButtonEl = document.querySelector(
  '[data-js-id="format-nql-query"]'
);

function formatNqlQuery() {
  const nqlQuery = nqlQueryInputEl.value;

  const tree = parser.parse(nqlQuery);

  const formatNode = (node) =>
    node.children
      .map((queryChild) => {
        if (queryChild.type === "clause") {
          return (
            "\n\n" +
            queryChild.children[0].text +
            " " +
            queryChild.children[1].children
              .map((c) => {
                if (
                  c.type === "and" ||
                  c.type === "by" ||
                  c.type === "field" ||
                  c.type === "or" ||
                  c.type === "sort_order" ||
                  c.type === "table" ||
                  c.type === "time_frame"
                ) {
                  return "\n  " + c.text;
                }

                return c.text;
              })
              .join(" ")
          );
        }

        if (queryChild.type === "time_frame") {
          return "\n  " + queryChild.text;
        }

        return " " + queryChild.text;
      })
      .join("")
      .trim();

  const formattedNql = tree.rootNode.children?.[0]
    ? formatNode(tree.rootNode.children[0])
    : nqlQuery;

  nqlQueryInputEl.value = formattedNql;
}

formatButtonEl.addEventListener("click", formatNqlQuery);

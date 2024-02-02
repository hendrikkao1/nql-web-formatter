# NQL web formatter

[Try it here](https://hendrikkao1.github.io/nql-web-formatter/)

Experimental tool to make [Nexthink query language (NQL)](https://docs.nexthink.com/platform/latest/nexthink-query-language-nql) more readable by applying formatting rules and syntax highlighting using a parser built with [tree sitter](https://github.com/tree-sitter/tree-sitter).

![Screenshot of the app](screenshot.png)

## Tests

Build image to run visual regression tests:

```sh
docker build -t test .
```

Run visual regression tests:

```sh
  docker run \
    --rm \
    --mount type=bind,source="$(pwd)",target=/usr/src/app \
    --mount type=volume,target=/usr/src/app/node_modules \
    test
```

Update visual regression tests:

```sh
  docker run \
    --rm \
    --mount type=bind,source="$(pwd)",target=/usr/src/app \
    --mount type=volume,target=/usr/src/app/node_modules \
    test -- --update-snapshots
```

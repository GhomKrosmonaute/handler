# File handler

This package is a file handler for NodeJS. It can load files from a directory, and it can reload the files if they changed.
You can handle any file type with this handler, but you need to write a loader function for it.

## Basic usage

```ts
import { Handler } from "@ghom/handler"

const handler = new Handler(" ... ") 

try {
  // For load the files, call this function:
  await handler.init()

  // You can access the loaded files with the "elements" property:
  console.log(handler.elements)
} catch(e) {
  console.error(e)
}

// For terminate the hot reloading and empty the handler cache, call this function:
handler.destroy()
```

## Config example for simple JS module handler

```ts
export const handler = new Handler("dist/files", {
  logger: console,
  loggerPattern: "loaded new table: $filename",
  loader: (path) => import(`file://${path}`),
  pattern: /\.js$/,
})

```

## Config example for js module handler with hot reloading

```ts
export const handler = new Handler("dist/files", {
  pattern: /\.js$/,
  hotReload: true,
  loader: (path) => import(`file://${path}?update=${Date.now()}`),
  onLoad: (path, data) => {
    // Do something with the loaded data
  },
  onChange: (path, data) => {
    // Do something with the changed data
  },
})
```

The `?update=${Date.now()}` text part is important if you want to import the changed file with the hot reloading.

## Same example but with CommonJS

```ts
const handler = new Handler("dist/files", {
  pattern: /\.js$/,
  hotReload: true,
  loader: (path) => {
    delete require.cache[require.resolve(path)]
    return require(path)
  },
  // ...
})
```

The `delete require.cache[require.resolve(path)]` line is important if you want to require the changed file with the hot reloading.

## Example for simple file handler (for txt files)

```ts
import fs from "fs"

const handler = new Handler("dist/files", {
  pattern: /\.txt$/i,
  hotReload: true,
  loader: async (filepath) => {
    return fs.promises.readFile(filepath, "utf8")
  },
})
```
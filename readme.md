# File handler

## Example for simple table handler with hot reloading

```ts
import { Handler } from "@ghom/handler"

export const handler = new Handler("dist/table", {
  logger: console,
  loggerPattern: "loaded new table: $filename",
  loader: (path) => import(`file://${path}?update=${Date.now()}`),
  pattern: /\.js$/,
  hotReload: true,
})

try {
  await handler.init()
} catch(e) {
  console.error(e)
}

console.log(handler.elements)

// For terminate the hot reloading and empty the handler cache, call this function:
handler.destroy()
```

The `?update=${Date.now()}` text part is important for hot reloading only.

## Or the same with CommonJS

```js
const { Handler } = require("@ghom/handler")

const handler = new Handler("dist/table", {
  logger: console,
  loggerPattern: "loaded new table: $filename",
  loader: (path) => {
    delete require.cache[require.resolve(path)]
    require(`file://${path}?update=${Date.now()}`)
  },
  pattern: /\.js$/,
  hotReload: true,
})
``` 

The `delete require.cache[require.resolve(path)]` line is important for hot reloading only.
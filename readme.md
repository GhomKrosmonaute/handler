# File handler

## Example for simple table handler

```ts
import { Handler } from "@ghom/handler"

export const handler = new Handler("dist/table", {
  logger: console,
  loggerPattern: "loaded new table: $filename",
  loader: (path) => import(`file://${path}`),
  pattern: /\.js$/,
})

try {
  await handler.init()
} catch(e) {
  console.error(e)
}

console.log(handler.elements)
```
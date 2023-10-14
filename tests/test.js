const path = require("path")
const { Handler } = require("../dist/index")

const handler = new Handler(path.join(__dirname, "files"), {
  pattern: /\.js$/i
})

test("load", (done) => {
  handler.init().then(done).catch(done)

  handler.on("load", (filepath) => {
    const file = require(filepath)

    expect(typeof file === "number" && file > -1 && file < 3).toBeTruthy()
  })
})

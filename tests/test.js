const path = require("path")
const { Handler } = require("../dist/index")

test("load", (done) => {
  const handler = new Handler(path.join(__dirname, "files"), {
    pattern: /\.js$/i,
    onLoad: (filepath) => {
      const file = require(filepath)

      expect(typeof file === "number" && file > -1 && file < 3).toBeTruthy()
    }
  })

  handler.init().then(done).catch(done)
})

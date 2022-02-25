const path = require("path")
const { Handler } = require("../dist/index")

const handler = new Handler(path.join(__dirname, "files"))

test("load", (done) => {
  handler.load().then(done).catch(done)

  handler.on("load", (filepath) => {
    const file = require(filepath)

    expect(typeof file === "number" && file > -1 && file < 3).toBeTruthy()
  })
})

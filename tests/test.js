const path = require("path")
const fs = require("fs")
const { Handler } = require("../dist/index")

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const Inputs = jest.fn().mockReturnValueOnce(42).mockReturnValueOnce(666)

const Outputs = jest
  .fn()
  .mockReturnValueOnce(0)
  .mockReturnValueOnce(1)
  .mockReturnValueOnce(2)
  .mockReturnValueOnce(42)
  .mockReturnValueOnce(666)

beforeAll(() => {
  fs.writeFileSync(
    path.join(__dirname, "files", "b.js"),
    "module.exports = 1\n"
  )
})

test("hot-reload", (done) => {
  const handler = new Handler(path.join(__dirname, "files"), {
    pattern: /\.js$/i,
    hotReload: true,
    loader: async (filepath) => {
      delete require.cache[path.resolve(filepath)]
      return require(filepath)
    },
    onLoad: async (filepath, data) => {
      console.log(path.basename(filepath), data)
      expect(data).toBe(Outputs())
    },
  })

  const tick = async () => {
    await fs.promises.writeFile(
      path.join(__dirname, "files", "b.js"),
      `module.exports = ${Inputs()}
`
    )

    await wait(150)

    console.log("tick")
  }

  handler
    .init()
    .then(tick)
    .then(tick)
    .then(() => {
      handler.destroy()
      done()
    })
    .catch(done)
})

afterAll(() => {
  fs.writeFileSync(
    path.join(__dirname, "files", "b.js"),
    "module.exports = 1\n"
  )
})

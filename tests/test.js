const path = require("path")
const fs = require("fs")
const { Handler } = require("../dist/index")

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const Inputs = jest.fn().mockReturnValueOnce("42").mockReturnValueOnce("666")

const Loaded = jest
  .fn()
  .mockReturnValueOnce("0")
  .mockReturnValueOnce("1")
  .mockReturnValueOnce("2")

const Reloaded = jest.fn().mockReturnValueOnce("42").mockReturnValueOnce("666")

beforeAll(() => {
  fs.writeFileSync(path.join(__dirname, "files", "b.txt"), "1")
})

test("test", (done) => {
  const handler = new Handler(path.join(__dirname, "files"), {
    pattern: /\.txt$/i,
    hotReload: true,
    loader: async (filepath) => {
      return fs.promises.readFile(filepath, "utf8")
    },
    onLoad: async (filepath, data) => {
      expect(data).toBe(Loaded())
    },
    onReload: async (filepath, data) => {
      expect(data).toBe(Reloaded())
    },
  })

  const tick = async () => {
    fs.writeFileSync(path.join(__dirname, "files", "b.txt"), Inputs())

    await wait(150)
  }

  handler
    .init()
    .then(() => wait(150))
    .then(tick)
    .then(tick)
    .then(() => {
      handler.destroy()
      done()
    })
    .catch(done)
})

afterAll(() => {
  fs.writeFileSync(path.join(__dirname, "files", "b.txt"), "1")
})

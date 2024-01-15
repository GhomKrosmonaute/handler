const path = require("path")
const fs = require("fs")
const { Handler } = require("../dist/index")

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const Loaded = jest
  .fn()
  .mockReturnValueOnce("0")
  .mockReturnValueOnce("1")
  .mockReturnValueOnce("2")

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
    onChange: async (filepath, data) => {
      expect(data).toBe("42")
    },
    onRemove: async (filepath, data) => {
      expect(data).toBe("42")
    },
  })

  handler
    .init()
    .then(() => wait(150))
    .then(async () => {
      fs.writeFileSync(path.join(__dirname, "files", "b.txt"), "42")

      await wait(150)
    })
    .then(async () => {
      fs.unlinkSync(path.join(__dirname, "files", "b.txt"))

      await wait(150)
    })
    .then(() => {
      handler.destroy()
      done()
    })
    .catch(done)
})

afterAll(() => {
  fs.writeFileSync(path.join(__dirname, "files", "b.txt"), "1")
})

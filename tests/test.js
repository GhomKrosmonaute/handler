const path = require("path")
const fs = require("fs")
const { Handler } = require("../dist/index")

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const Loaded = jest
  .fn()
  .mockReturnValueOnce("0")
  .mockReturnValueOnce("1")
  .mockReturnValueOnce("2")
  .mockReturnValueOnce("0")
  .mockReturnValueOnce("1")
  .mockReturnValueOnce("2")

beforeAll(() => {
  fs.writeFileSync(path.join(__dirname, "files", "b.txt"), "1")
})

test("with files", (done) => {
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
//
// test("with modules", () => {
//   const handler = new Handler(path.join(__dirname, "modules"), {
//     pattern: /\.js$/i,
//     hotReload: true,
//     loader: async (filepath) => {
//       return require(filepath)
//     },
//     onLoad: async (filepath, data) => {
//       expect(data).toBe(Loaded())
//     },
//     onChange: async (filepath, data) => {
//       expect(data).toBe("42")
//     },
//     onRemove: async (filepath, data) => {
//       expect(data).toBe("42")
//     },
//   })
//
//   handler.init()
//
//   fs.writeFileSync(
//     path.join(__dirname, "modules", "b.js"),
//     "module.exports = 42"
//   )
//
//   fs.unlinkSync(path.join(__dirname, "modules", "b.js"))
//
//   handler.destroy()
// })

afterAll(() => {
  fs.writeFileSync(path.join(__dirname, "files", "b.txt"), "1")
})

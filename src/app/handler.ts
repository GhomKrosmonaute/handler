import path from "path"
import md5 from "md5"
import fs from "fs"
import chokidar from "chokidar"

export interface HandlerOptions<Data> {
  /**
   * File basename pattern to filter files
   */
  pattern?: RegExp
  /**
   * @default false
   */
  hotReload?: boolean
  /**
   * @default 100
   */
  hotReloadTimeout?: number
  /**
   * If you want to log the file loading process, you can set up a logger. <br>
   * The logger must have a log method that accepts a string as a parameter. <br>
   * @example ```ts
   * const handler = new Handler("./commands", {
   *   logger: console
   * })
   * ```
   */
  logger?: {
    log: (message: string) => void
  }
  /**
   * Use $path to replace by file path <br>
   * Use $basename to replace by file name <br>
   * Use $filename to replace by file name without extension <br>
   * @example ```ts
   * const handler = new Handler("./commands", {
   *   loggerPattern: "$filename loaded"
   *   logger: console
   * })
   * ```
   */
  loggerPattern?: string
  /**
   * This method will load the file and return the data. <br>
   * The data will be stored in the {@link Handler.elements} map.
   */
  loader: (path: string) => Promise<Data>
  /**
   * This method will be called when the file is loaded. <br>
   * The data will be transferred from the {@link loader} method.
   */
  onLoad?: (path: string, data: Data) => Promise<void>
  /**
   * If this function is defined, the changed files will stop
   * going through the {@link onLoad} function and go through this one instead
   */
  onChange?: (path: string, data: Data) => Promise<void>
  /**
   * This method will be called when the file is removed.
   */
  onRemove?: (path: string, oldData: Data) => Promise<void>
  /**
   * This method will be called after all files are loaded, at the end of the {@link Handler.init} method.
   */
  onFinish?: (data: Map<string, Data>) => Promise<void>
}

export class Handler<Data> {
  public elements: Map<string, Data> = new Map()
  public md5: Map<string, string> = new Map()
  public watcher?: chokidar.FSWatcher

  public constructor(
    private dirname: string,
    private options: HandlerOptions<Data>
  ) {}

  async init(this: this) {
    this.elements.clear()

    const filenames = await fs.promises.readdir(this.dirname)

    for (const basename of filenames) {
      const filepath = path.join(this.dirname, basename)

      try {
        await this._load(filepath, false)
      } catch (error: any) {
        if (error.message.startsWith("Ignored")) continue
        else throw error
      }
    }

    await this.options.onFinish?.(this.elements)

    if (this.options.hotReload)
      this.watcher = chokidar
        .watch(path.join(this.dirname, "*.*"))
        .on("all", async (event, filepath) => {
          try {
            switch (event) {
              case "add":
              case "change":
                await this._load(filepath, event === "change")
                break
              case "unlink":
                await this._remove(filepath)
                break
            }
          } catch (error: any) {
            if (error.message.startsWith("Ignored")) return
            else throw error
          }
        })
  }

  destroy(this: this) {
    this.watcher?.close()
    this.elements.clear()
    this.md5.clear()
  }

  private async _load(
    this: this,
    filepath: string,
    reloaded: boolean
  ): Promise<void> {
    const basename = path.basename(filepath)
    const filename = path.basename(filepath, path.extname(filepath))

    if (this.options.pattern && !this.options.pattern.test(basename))
      throw new Error(`Ignored ${basename} by pattern`)

    if (this.options.hotReload) {
      const md5sum = md5(fs.readFileSync(filepath))

      if (this.md5.get(filepath) === md5sum)
        throw new Error(`Ignored ${basename} by md5 check`)
      else this.md5.set(filepath, md5sum)
    }

    if (this.options.logger)
      this.options.logger.log(
        this.options.loggerPattern
          ? this.options.loggerPattern
              .replace("$path", filepath)
              .replace("$basename", basename)
              .replace("$filename", filename)
          : `loaded ${filename}`
      )

    let loaded!: Data

    const onLoad = reloaded
      ? this.options.onChange ?? this.options.onLoad
      : this.options.onLoad

    loaded = await this.options.loader(filepath)
    this.elements.set(filepath, loaded)

    if (onLoad) {
      await onLoad(filepath, loaded)
    }
  }

  private async _remove(this: this, filepath: string): Promise<void> {
    const basename = path.basename(filepath)
    const filename = path.basename(filepath, path.extname(filepath))

    if (this.options.pattern && !this.options.pattern.test(basename))
      throw new Error(`Ignored ${basename} by pattern`)

    if (!this.elements.has(filepath))
      throw new Error(`Ignored ${basename} because isn't loaded`)

    if (this.options.logger)
      this.options.logger.log(
        this.options.loggerPattern
          ? this.options.loggerPattern
              .replace("$path", filepath)
              .replace("$basename", basename)
              .replace("$filename", filename)
          : `removed ${filename}`
      )

    const data = this.elements.get(filepath)!

    this.elements.delete(filepath)
    this.md5.delete(filepath)

    await this.options.onRemove?.(filepath, data)
  }
}

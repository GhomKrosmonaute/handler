import path from "path"
import md5 from "md5"
import fs from "fs"

export interface HandlerOptions<Data> {
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
  loader?: (path: string) => Promise<Data>
  /**
   * If this function is defined, the reloaded files will be loaded by this function instead of the loader
   */
  reloader?: (path: string) => Promise<Data>
  pattern?: RegExp
  onLoad?: (path: string, data?: Data) => Promise<void>
  /**
   * If this function is defined, the reloaded files will stop
   * going through the onLoad function and go through this one instead
   */
  onReload?: (path: string, data?: Data) => Promise<void>
  onFinish?: (paths: string[]) => Promise<void>
  /**
   * @default false
   */
  hotReload?: boolean
  /**
   * @default 100
   */
  hotReloadTimeout?: number
}

export class Handler<Data> {
  public elements: Map<string, Data> = new Map()
  public md5: Map<string, string> = new Map()
  public timeouts: Map<string, NodeJS.Timeout | false> = new Map()
  public watcher?: fs.FSWatcher

  public constructor(
    private path: string,
    private options?: HandlerOptions<Data>
  ) {}

  async init(this: this) {
    this.elements.clear()

    const filenames = await fs.promises.readdir(this.path)
    const filepathList: string[] = []

    for (const basename of filenames) {
      try {
        filepathList.push(await this._handle(basename, false))
      } catch (error: any) {
        if (error.message.startsWith("Ignored")) continue
        else throw error
      }
    }

    await this.options?.onFinish?.(filepathList)

    if (this.options?.hotReload)
      this.watcher = fs.watch(this.path, async (event, basename) => {
        if (event !== "change" || !basename) return

        try {
          await this._handle(basename, true)
        } catch (error: any) {
          if (error.message.startsWith("Ignored")) return
          else throw error
        }
      })
  }

  destroy(this: this) {
    this.watcher?.close()
    this.timeouts.forEach((timeout) => timeout && clearTimeout(timeout))
    this.timeouts.clear()
    this.elements.clear()
    this.md5.clear()
  }

  private async _handle(
    this: this,
    basename: string,
    reloaded: boolean
  ): Promise<string> {
    if (this.options?.pattern && !this.options.pattern.test(basename))
      throw new Error(`Ignored ${basename} by pattern`)

    const filepath = path.join(this.path, basename)
    const filename = path.basename(filepath, path.extname(filepath))

    if (this.options?.hotReload) {
      if (this.timeouts.get(filepath))
        throw new Error(`Ignored ${basename} by timeout`)

      this.timeouts.set(
        filepath,
        setTimeout(() => {
          this.timeouts.set(filepath, false)
        }, this.options.hotReloadTimeout ?? 100)
      )

      const md5sum = md5(fs.readFileSync(filepath))

      if (this.md5.get(filepath) === md5sum)
        throw new Error(`Ignored ${basename} by md5 check`)
      else this.md5.set(filepath, md5sum)
    }

    if (this.options?.logger)
      this.options.logger.log(
        this.options.loggerPattern
          ? this.options.loggerPattern
              .replace("$path", filepath)
              .replace("$basename", basename)
              .replace("$filename", filename)
          : `loaded ${filename}`
      )

    let loaded!: Data

    const loader = reloaded
      ? this.options?.reloader ?? this.options?.loader
      : this.options?.loader
    const onLoad = reloaded
      ? this.options?.onReload ?? this.options?.onLoad
      : this.options?.onLoad

    if (loader) {
      loaded = await loader(filepath)
      this.elements.set(filepath, loaded)
    }

    if (onLoad) {
      await onLoad(filepath, loaded)
    }

    return filepath
  }
}

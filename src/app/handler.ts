import path from "path"
import fs from "fs/promises"

import { EventEmitter, BaseEventNames } from "@ghom/event-emitter"

export interface HandlerEvents extends BaseEventNames {
  load: [path: string]
  finish: [pathList: string[]]
}

export interface HandlerOptions<Element> {
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
  loader?: (path: string) => Promise<Element>
}

export class Handler<Element> extends EventEmitter<HandlerEvents> {
  public elements: Map<string, Element> = new Map()

  constructor(private path: string, private options?: HandlerOptions<Element>) {
    super()
  }

  /**
   * Here to prevent breaking changes.
   * @deprecated Use `load` instead.
   */
  async load() {
    await this.init()
  }

  async init() {
    this.elements.clear()

    const filenames = await fs.readdir(this.path)
    const filepathList: string[] = []
    for (const basename of filenames) {
      const filepath = path.join(this.path, basename)
      const filename = path.basename(filepath, path.extname(filepath))

      filepathList.push(filepath)

      if (this.options?.logger)
        this.options.logger.log(
          this.options.loggerPattern
            ? this.options.loggerPattern
                .replace("$path", filepath)
                .replace("$basename", basename)
                .replace("$filename", filename)
            : `loaded ${filename}`
        )

      if (this.options?.loader)
        this.elements.set(filepath, await this.options.loader(filepath))

      await this.emit("load", filepath)
    }
    await this.emit("finish", filepathList)
  }
}

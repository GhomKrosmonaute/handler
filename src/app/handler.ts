import path from "path"
import fs from "fs/promises"

import { EventEmitter, BaseEventNames } from "@ghom/event-emitter"

export interface HandlerEvents extends BaseEventNames {
  load: { params: [path: string]; context: null }
  finish: { params: [pathList: string[]]; context: null }
}

export class Handler extends EventEmitter<HandlerEvents> {
  constructor(private path: string) {
    super()
  }

  async load() {
    const filenames = await fs.readdir(this.path)
    const filepathList: string[] = []
    for (const filename of filenames) {
      const filepath = path.join(this.path, filename)
      filepathList.push(filepath)
      await this.emit("load", [filepath], null)
    }
    await this.emit("finish", [filepathList], null)
  }
}

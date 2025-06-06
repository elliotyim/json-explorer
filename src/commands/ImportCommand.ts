import { UPLOAD_LIMIT } from '@/constants/file'
import { FileUtil } from '@/utils/file'

export class ImportCommand implements Command<JSONObj['type']> {
  prev: JSONObj['type'] = {}
  value: JSONObj['type'] = {}
  isReversible: boolean = true as const

  constructor(prev: JSONObj['type']) {
    this.prev = prev
  }

  private async importJSON(): Promise<JSONObj['type']> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')

      input.type = 'file'
      input.accept = 'application/json, .json'

      input.onchange = (e) => {
        const target = e.target as HTMLInputElement
        if (target.files?.length === 1) {
          const file = target.files[0]
          if (file.size > UPLOAD_LIMIT) {
            return reject(`File size exceeds ${FileUtil.convert(UPLOAD_LIMIT)}`)
          }

          const reader = new FileReader()
          reader.onload = (event) => {
            try {
              const content = event.target?.result as string
              resolve(JSON.parse(content))
            } catch {
              return reject('Invalid JSON file has been provided')
            }
          }
          reader.onerror = () => reject('Failed to read the file')
          reader.readAsText(file)
        }
      }

      input.click()
    })
  }

  async execute(): Promise<JSONObj['type'] | null> {
    const cacheExists = Object.keys(this.value).length != 0
    if (cacheExists) return new Promise((res) => res(this.value))

    const result = await this.importJSON()
    this.value = result

    return new Promise((res) => res(result))
  }

  async undo(): Promise<JSONObj['type'] | null> {
    return new Promise((res) => res(this.prev))
  }
}

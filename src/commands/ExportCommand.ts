export class ExportCommand implements Command<JSONObj['type']> {
  prev: JSONObj['type'] = {}
  value: string = ''
  isReversible: boolean = false

  constructor(jsonString: string) {
    this.value = jsonString
  }

  private exportJSON(jsonString: string): void {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'output.json'
    a.click()
  }

  execute(): Promise<JSONObj['type']> {
    this.exportJSON(this.value)
    return new Promise((res) => res(this.prev))
  }

  undo(): Promise<JSONObj['type']> {
    throw Error("This method shouldn't be called!")
  }
}

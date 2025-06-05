import { CommandManager } from '@/utils/command'
import { useState } from 'react'

interface ReturnProps {
  commandManager: CommandManager
}

export const useCommands = (): ReturnProps => {
  const [commandManager] = useState<CommandManager>(new CommandManager())
  return { commandManager }
}

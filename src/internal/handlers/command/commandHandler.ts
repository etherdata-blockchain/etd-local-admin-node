export interface RemoteCommand<T>{
    command: string;
    data?: T
}


export abstract class CommandHandler<T>{

    abstract supportCommand: string

    /**
     * Return whether this command can be handled by this handler
     * @param command
     */
    canHandle(command: RemoteCommand<T>): boolean{
        return command.command.toLowerCase() === this.supportCommand.toLowerCase();
    }

    /**
     * Handle this command
     * @param command
     */
    abstract handle(command: RemoteCommand<T>): Promise<any>
}
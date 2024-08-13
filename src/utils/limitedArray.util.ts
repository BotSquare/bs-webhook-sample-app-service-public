export default class LimitedArray<T> {
    private items: T[] = [];
    private readonly maxLength: number;
  
    constructor(maxLength: number = 100) {
      this.maxLength = maxLength;
    }
  
    public push(item: T): void {
      if (this.items.length >= this.maxLength) {
        // Remove the first item to make space for the new one
        this.items.shift();
      }
      this.items.push(item);
    }
  
    public isItemExist(item: T): boolean {
      return this.items.includes(item);
    }
  }
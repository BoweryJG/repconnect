export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'idle';

interface RenderTask {
  id: string;
  priority: Priority;
  work: () => void | Promise<void>;
  deadline?: number;
  chunked?: boolean;
}

export class RenderQueue {
  private queues: Map<Priority, RenderTask[]> = new Map([
    ['critical', []],
    ['high', []],
    ['medium', []],
    ['low', []],
    ['idle', []]
  ]);

  private isProcessing = false;
  private frameDeadline = 16; // 16ms for 60fps
  private rafId: number | null = null;

  public addTask(task: RenderTask) {
    const queue = this.queues.get(task.priority)!;
    queue.push(task);
    
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  private startProcessing() {
    this.isProcessing = true;
    this.processNextBatch();
  }

  private processNextBatch() {
    const startTime = performance.now();
    let processed = false;

    // Process tasks by priority
    for (const [priority, queue] of this.queues) {
      while (queue.length > 0) {
        const elapsed = performance.now() - startTime;
        
        // Check if we have time left in this frame
        if (elapsed >= this.frameDeadline && priority !== 'critical') {
          // Yield to browser to maintain 60fps
          this.rafId = requestAnimationFrame(() => this.processNextBatch());
          return;
        }

        const task = queue.shift()!;
        
        if (task.chunked) {
          // Process chunked tasks over multiple frames
          this.processChunkedTask(task);
        } else {
          // Execute task immediately
          task.work();
        }
        
        processed = true;
        
        // For critical tasks, ignore frame budget
        if (priority === 'critical') {
          continue;
        }
        
        // Break if we've used too much time
        if (performance.now() - startTime >= this.frameDeadline) {
          break;
        }
      }
    }

    if (processed) {
      this.rafId = requestAnimationFrame(() => this.processNextBatch());
    } else {
      this.isProcessing = false;
    }
  }

  private async processChunkedTask(task: RenderTask) {
    // Use requestIdleCallback for low priority chunked tasks
    if (task.priority === 'low' || task.priority === 'idle') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => task.work(), { timeout: task.deadline || 50 });
      } else {
        setTimeout(() => task.work(), 0);
      }
    } else {
      await task.work();
    }
  }

  public clear(priority?: Priority) {
    if (priority) {
      this.queues.get(priority)!.length = 0;
    } else {
      this.queues.forEach(queue => queue.length = 0);
    }
  }

  public destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.clear();
    this.isProcessing = false;
  }
}

export const renderQueue = new RenderQueue();
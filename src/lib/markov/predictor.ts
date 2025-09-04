// markov-predictor.ts
type Outcome = "WIN" | "LOSE";
type Matrix = Record<Outcome, Record<Outcome, number>>; // probabilities

export interface PredictorOptions {
  // Known long-run distribution (defaults set to your values)
  priorWin?: number; // default 0.165
  priorLose?: number; // default 0.835

  // Target sample size to which we want to converge (e.g., 100)
  targetSample?: number; // default 100

  // If provided, overrides dynamic prior strength (pseudo-count weight)
  // Example: return a fixed number like 10, or a dynamic number like 100 - n
  priorStrengthFn?: (nObserved: number, targetSample: number) => number;
}

export interface Decision {
  nextProb: { WIN: number; LOSE: number };
  prediction: Outcome;
  decision: "BET" | "STAND";
  threshold: number;
  lastState: Outcome | null;
  transitionMatrix: Matrix;
}

export class MarkovPredictor {
  private results: Outcome[] = [];
  private transitionCounts: Record<Outcome, Record<Outcome, number>> = {
    WIN: { WIN: 0, LOSE: 0 },
    LOSE: { WIN: 0, LOSE: 0 },
  };

  private priorWin: number;
  private priorLose: number;
  private targetSample: number;
  private priorStrengthFn: (nObserved: number, targetSample: number) => number;

  constructor(initialResults: Outcome[] = [], opts: PredictorOptions = {}) {
    this.priorWin = opts.priorWin ?? 0.165;
    this.priorLose = opts.priorLose ?? 0.835;
    if (Math.abs(this.priorWin + this.priorLose - 1) > 1e-9) {
      throw new Error("Prior WIN + LOSE must equal 1");
    }

    this.targetSample = opts.targetSample ?? 100;

    // Default: priorStrength = max(0, targetSample - nObserved)
    this.priorStrengthFn =
      opts.priorStrengthFn ??
      ((nObserved, target) => Math.max(0, target - nObserved));

    if (initialResults.length > 0) {
      this.results = initialResults.slice();
      this.rebuildTransitions();
    }
  }

  // ----------------------
  // Mutators
  // ----------------------
  addResult(outcome: Outcome): void {
    if (this.results.length > 0) {
      const last = this.results[this.results.length - 1];
      this.transitionCounts[last][outcome]++;
    }
    this.results.push(outcome);
  }

  addResults(batch: Outcome[]): void {
    for (const r of batch) this.addResult(r);
  }

  reset(results: Outcome[] = []): void {
    this.results = [];
    this.transitionCounts = {
      WIN: { WIN: 0, LOSE: 0 },
      LOSE: { WIN: 0, LOSE: 0 },
    };
    if (results.length) {
      this.results = results.slice();
      this.rebuildTransitions();
    }
  }

  // ----------------------
  // Core calculations
  // ----------------------
  private rebuildTransitions(): void {
    this.transitionCounts = {
      WIN: { WIN: 0, LOSE: 0 },
      LOSE: { WIN: 0, LOSE: 0 },
    };
    for (let i = 0; i < this.results.length - 1; i++) {
      const a = this.results[i];
      const b = this.results[i + 1];
      this.transitionCounts[a][b]++;
    }
  }

  private getPriorStrength(): number {
    return this.priorStrengthFn(this.results.length, this.targetSample);
  }

  /**
   * Compute smoothed transition matrix using:
   *   P(next=WIN | prev=s) = (count + alphaWIN) / (total + alphaWIN + alphaLOSE)
   * where alphaWIN = priorStrength * priorWin, etc.
   *
   * Note: We use the same prior for both rows (WIN and LOSE) because we only
   * know the marginal long-run rate, not row-specific dynamics. This is a
   * reasonable, conservative Bayesian shrinkage.
   */
  getTransitionMatrix(): Matrix {
    const matrix: Matrix = {
      WIN: { WIN: 0, LOSE: 0 },
      LOSE: { WIN: 0, LOSE: 0 },
    };

    const priorStrength = this.getPriorStrength();
    const alphaWIN = priorStrength * this.priorWin;
    const alphaLOSE = priorStrength * this.priorLose;

    (["WIN", "LOSE"] as Outcome[]).forEach((prev) => {
      const cWIN = this.transitionCounts[prev].WIN;
      const cLOSE = this.transitionCounts[prev].LOSE;
      const total = cWIN + cLOSE;

      const denom = total + alphaWIN + alphaLOSE;
      const pWIN = denom > 0 ? (cWIN + alphaWIN) / denom : this.priorWin;
      const pLOSE = 1 - pWIN;

      matrix[prev].WIN = pWIN;
      matrix[prev].LOSE = pLOSE;
    });

    return matrix;
  }

  predictNext(): Outcome | null {
    if (this.results.length === 0) return null;
    const last = this.results[this.results.length - 1];
    const matrix = this.getTransitionMatrix();
    return matrix[last].WIN >= matrix[last].LOSE ? "WIN" : "LOSE";
  }

  /**
   * Decision with confidence threshold
   * - If P(WIN | last) >= threshold -> BET, else STAND
   */
  decideNext(threshold = 0.5): Decision {
    const last = this.results.length
      ? this.results[this.results.length - 1]
      : null;

    if (!last) {
      // No history — fall back to priors
      const pWin = this.priorWin;
      return {
        nextProb: { WIN: pWin, LOSE: 1 - pWin },
        prediction: pWin >= 0.5 ? "WIN" : "LOSE",
        decision: pWin >= threshold ? "BET" : "STAND",
        threshold,
        lastState: null,
        transitionMatrix: {
          WIN: { WIN: this.priorWin, LOSE: this.priorLose },
          LOSE: { WIN: this.priorWin, LOSE: this.priorLose },
        },
      };
    }

    const M = this.getTransitionMatrix();
    const pWin = M[last].WIN;

    return {
      nextProb: { WIN: pWin, LOSE: 1 - pWin },
      prediction: pWin >= 0.5 ? "WIN" : "LOSE",
      decision: pWin >= threshold ? "BET" : "STAND",
      threshold,
      lastState: last,
      transitionMatrix: M,
    };
  }

  // ----------------------
  // Simulation utilities
  // ----------------------
  simulateNext(nSimulations = 10000): { WIN: number; LOSE: number } {
    if (this.results.length === 0) {
      return { WIN: this.priorWin, LOSE: this.priorLose };
    }
    const last = this.results[this.results.length - 1];
    const M = this.getTransitionMatrix();

    let w = 0;
    for (let i = 0; i < nSimulations; i++) {
      const rnd = Math.random();
      if (rnd < M[last].WIN) w++;
    }
    const pW = w / nSimulations;
    return { WIN: pW, LOSE: 1 - pW };
  }

  /**
   * Simulate a block of future games, returning the average marginal frequency
   * of WIN vs LOSE across the horizon (good for sanity vs the 16.5% anchor).
   */
  simulateFutureGames(
    nGames: number,
    nSimulations = 5000,
  ): { WIN: number; LOSE: number } {
    const M = this.getTransitionMatrix();

    let wTotal = 0;
    let lTotal = 0;

    for (let s = 0; s < nSimulations; s++) {
      let curr: Outcome =
        this.results.length > 0
          ? this.results[this.results.length - 1]
          : Math.random() < this.priorWin
            ? "WIN"
            : "LOSE";

      let w = 0;
      let l = 0;

      for (let g = 0; g < nGames; g++) {
        const rnd = Math.random();
        const next = rnd < M[curr].WIN ? "WIN" : "LOSE";
        if (next === "WIN") w++;
        else l++;
        curr = next;
      }

      wTotal += w;
      lTotal += l;
    }

    const denom = nSimulations * nGames;
    return { WIN: wTotal / denom, LOSE: lTotal / denom };
  }

  // ----------------------
  // Inspectors
  // ----------------------
  getHistory(): Outcome[] {
    return this.results.slice();
  }

  getCounts() {
    return JSON.parse(JSON.stringify(this.transitionCounts)) as Record<
      Outcome,
      Record<Outcome, number>
    >;
  }

  getPriorInfo() {
    return {
      priorWin: this.priorWin,
      priorLose: this.priorLose,
      targetSample: this.targetSample,
      currentPriorStrength: this.getPriorStrength(),
    };
  }
}

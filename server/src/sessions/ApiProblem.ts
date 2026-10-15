/** An error that maps directly to an HTTP response with a stable error code. */
export class ApiProblem extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiProblem';
  }
}

import {
  createTypeScriptRun,
  type TypeScriptRunRequest,
  type TypeScriptRunResult,
  type TypeScriptRunController,
} from "./typescript-family";

export function createTypeScriptRunController(initialRevision = 0): TypeScriptRunController {
  let revision = initialRevision;
  let disposed = false;

  return {
    get revision() {
      return revision;
    },
    get disposed() {
      return disposed;
    },
    run(request: TypeScriptRunRequest): TypeScriptRunResult | null {
      if (disposed) return null;
      const requestedRevision = request.revision ?? revision + 1;
      if (requestedRevision < revision) return null;
      revision = requestedRevision;
      return createTypeScriptRun({ ...request, revision });
    },
    reset() {
      if (!disposed) revision += 1;
      return revision;
    },
    dispose() {
      disposed = true;
      revision += 1;
    },
  };
}

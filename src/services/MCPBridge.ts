interface MCPContextRequest {
  provider: string;
  service: string;
  args?: Record<string, unknown>;
}

export const MCPBridge = {
  async getContext(request: MCPContextRequest) {
    return {
      provider: request.provider,
      service: request.service,
      args: request.args ?? {},
      status: "unconfigured",
      context: null,
    };
  },
};

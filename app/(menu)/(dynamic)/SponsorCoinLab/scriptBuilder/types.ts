export type ConnectionMode = 'metamask' | 'hardhat';
export type MethodPanelMode = 'ecr20_read' | 'erc20_write' | 'spcoin_rread' | 'spcoin_write' | 'serialization_tests';
export type ScriptStepPanelMode = MethodPanelMode;

export type LabScriptParam = {
  key: string;
  value: string;
};

export type LabScriptStep = {
  step: number;
  name: string;
  panel: ScriptStepPanelMode;
  method: string;
  params: LabScriptParam[];
  breakpoint?: boolean;
  hasMissingRequiredParams?: boolean;
  network?: string;
  mode?: ConnectionMode;
  'msg.sender'?: string;
};

export type LabScript = {
  id: string;
  name: string;
  'Date Created': string;
  network: string;
  steps: LabScriptStep[];
};

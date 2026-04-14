// File: app/(menu)/(dynamic)/SpCoinAccessController/components/StatusBlocks.tsx
import React from 'react';

export function ErrorWordStatus({ message }: { message: string }) {
  const parts = String(message || '').split(/(Error:?)/g);
  return (
    <>
      {parts.map((part, index) =>
        /^Error:?$/.test(part) ? (
          <span key={`error-part-${index}`} className="text-red-400">
            {part}
          </span>
        ) : (
          <span key={`error-part-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

export function NpmStatusBlock({ status }: { status: string }) {
  return status.startsWith('Version set to ') ? (
    <p className="leading-6">
      Version set to <span className="font-semibold text-green-400">{status.replace('Version set to ', '')}</span>
    </p>
  ) : status.startsWith('Success:') ? (
    <p className="leading-6 text-white">
      <span className="text-green-400">Success:</span>
      <span>{status.replace(/^Success:\s*/, ' ')}</span>
    </p>
  ) : (
    <p className="leading-6 text-white">
      <ErrorWordStatus message={status} />
    </p>
  );
}

type DeploymentStatusBlockProps = {
  deploymentStatus: string;
  deploymentStatusIsError: boolean;
};

export function DeploymentStatusBlock({
  deploymentStatus,
  deploymentStatusIsError,
}: DeploymentStatusBlockProps) {
  const deploymentVersionStatusMatch = deploymentStatus.match(/^(.+?)( set for deployment\.)$/);
  const deploymentScaffoldStatusMatch = deploymentStatus.match(
    /^Status: (\d+)\r?\nMocked Deployment: ([\s\S]*?)\r?\nContract Address: (.+)\r?\nContract Name: (.+)\r?\nNetwork: (.+)\r?\n\r?\nSet toggle radio button to Blockchain for real deployment execution$/,
  );
  const deploymentMockingStatusMatch = deploymentStatus.match(
    /^Status: (.+)\r?\nMocked Deployment: "([^"]+)" is ready for deployment\.\r?\nContract Address: (.+)\r?\nContract Name: (.+)\r?\nNetwork: (.+)\r?\n\r?\nSet toggle radio button to Blockchain for real deployment execution$/,
  );
  const deploymentReadyStatusMatch = deploymentStatus.match(
    /^Status: (.+)\r?\nBlockchain Deployment: "([^"]+)" is ready for deployment\.\r?\nContract Address: (.+)\r?\nContract Name: (.+)\r?\nNetwork: (.+)\r?\n\r?\nPress Deploy to execute blockchain deployment$/,
  );
  const deploymentAlreadyDeployedStatusMatch = deploymentStatus.match(
    /^Status: (.+)\r?\nBlockchain Deployment: "([^"]+)" is already deployed\.\r?\nContract Address: (.+)\r?\nContract Name: (.+)\r?\nNetwork: (.+)\r?\n[\s\S]*?\r?\n\r?\nDeployment button disabled because this contract is already deployed$/,
  );
  const deploymentErrorStatusMatch = deploymentStatus.match(/^(\*Error:)(.*)$/);
  const deploymentEmptyKeyStatusMatch = deploymentStatus.match(
    /^(\*Error:)( Empty Account Private Key for deploymnet token ")([^"]+)(")$/,
  );
  const deploymentInvalidKeyStatusMatch = deploymentStatus.match(
    /^(\*Error:)( Invalid Account Private Key for deploymnet token ")([^"]+)(")$/,
  );

  return (
    <p className="leading-6 text-white">
      {!deploymentStatusIsError && deploymentVersionStatusMatch ? (
        <>
          <span className="font-semibold text-green-400">{deploymentVersionStatusMatch[1]}</span>
          <span>{deploymentVersionStatusMatch[2]}</span>
        </>
      ) : !deploymentStatusIsError && deploymentScaffoldStatusMatch ? (
        <>
          <span>{`Status: ${deploymentScaffoldStatusMatch[1]}`}</span>
          <br />
          <span>{`Mocked Deployment: ${deploymentScaffoldStatusMatch[2]}`}</span>
          <br />
          <span>{`Contract Address: ${deploymentScaffoldStatusMatch[3]}`}</span>
          <br />
          <span>{`Contract Name: ${deploymentScaffoldStatusMatch[4]}`}</span>
          <br />
          <span>{`Network: ${deploymentScaffoldStatusMatch[5]}`}</span>
          <br />
          <br />
          <span>Set toggle radio button to Blockchain for real deployment execution</span>
        </>
      ) : !deploymentStatusIsError && deploymentMockingStatusMatch ? (
        <>
          <span>{`Status: ${deploymentMockingStatusMatch[1]}`}</span>
          <br />
          <span>Mocked Deployment: "</span>
          <span className="font-semibold text-green-400">{deploymentMockingStatusMatch[2]}</span>
          <span>" is ready for deployment.</span>
          <br />
          <span>{`Contract Address: ${deploymentMockingStatusMatch[3]}`}</span>
          <br />
          <span>{`Contract Name: ${deploymentMockingStatusMatch[4]}`}</span>
          <br />
          <span>{`Network: ${deploymentMockingStatusMatch[5]}`}</span>
          <br />
          <br />
          <span>Set toggle radio button to Blockchain for real deployment execution</span>
        </>
      ) : !deploymentStatusIsError && deploymentReadyStatusMatch ? (
        <>
          <span>{`Status: ${deploymentReadyStatusMatch[1]}`}</span>
          <br />
          <span>Blockchain Deployment: "</span>
          <span className="font-semibold text-green-400">{deploymentReadyStatusMatch[2]}</span>
          <span>" is ready for deployment.</span>
          <br />
          <span>{`Contract Address: ${deploymentReadyStatusMatch[3]}`}</span>
          <br />
          <span>{`Contract Name: ${deploymentReadyStatusMatch[4]}`}</span>
          <br />
          <span>{`Network: ${deploymentReadyStatusMatch[5]}`}</span>
          <br />
          <br />
          <span>Press Deploy to execute blockchain deployment</span>
        </>
      ) : !deploymentStatusIsError && deploymentAlreadyDeployedStatusMatch ? (
        <>
          <span>Status: </span>
          <span className="font-semibold text-green-400">{deploymentAlreadyDeployedStatusMatch[1]}</span>
          <br />
          <span>Blockchain Deployment: "</span>
          <span className="font-semibold text-green-400">{deploymentAlreadyDeployedStatusMatch[2]}</span>
          <span>" is already deployed.</span>
          <br />
          <span>{`Contract Address: ${deploymentAlreadyDeployedStatusMatch[3]}`}</span>
          <br />
          <span>{`Contract Name: ${deploymentAlreadyDeployedStatusMatch[4]}`}</span>
          <br />
          <span>{`Network: ${deploymentAlreadyDeployedStatusMatch[5]}`}</span>
          <br />
          <br />
          <span>Deployment button disabled because this contract is already deployed</span>
        </>
      ) : deploymentStatusIsError && deploymentEmptyKeyStatusMatch ? (
        <>
          <span>*</span>
          <span className="text-red-400">Error:</span>
          <span>{deploymentEmptyKeyStatusMatch[2]}</span>
          <span className="font-semibold text-green-400">{deploymentEmptyKeyStatusMatch[3]}</span>
          <span>{deploymentEmptyKeyStatusMatch[4]}</span>
        </>
      ) : deploymentStatusIsError && deploymentInvalidKeyStatusMatch ? (
        <>
          <span>*</span>
          <span className="text-red-400">Error:</span>
          <span>{deploymentInvalidKeyStatusMatch[2]}</span>
          <span className="font-semibold text-green-400">{deploymentInvalidKeyStatusMatch[3]}</span>
          <span>{deploymentInvalidKeyStatusMatch[4]}</span>
        </>
      ) : deploymentStatusIsError && deploymentErrorStatusMatch ? (
        <>
          <span>*</span>
          <span className="text-red-400">Error:</span>
          <span>{deploymentErrorStatusMatch[2]}</span>
        </>
      ) : (
        deploymentStatus
      )}
    </p>
  );
}

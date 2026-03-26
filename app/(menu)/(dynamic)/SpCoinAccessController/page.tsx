// File: app/(menu)/(dynamic)/SpCoinAccessController/page.tsx
'use client';

import React from 'react';
import OpenCloseBtn from '@/components/views/Buttons/OpenCloseBtn';
import NpmAccessPanel from './components/NpmAccessPanel';
import DeploymentControllerPanel from './components/DeploymentControllerPanel';
import { useSpCoinAccessController } from './hooks/useSpCoinAccessController';

export default function SpCoinAccessControllerPage() {
  const controller = useSpCoinAccessController();
  const [expandedPanel, setExpandedPanel] = React.useState<'npm' | 'deploy' | null>(null);
  const showNpmPanel = expandedPanel === null || expandedPanel === 'npm';
  const showDeploymentPanel = expandedPanel === null || expandedPanel === 'deploy';

  return (
    <main
      className="relative box-border flex w-full flex-col overflow-hidden bg-[#0B1020] px-6 pt-3 text-white"
      style={{ height: `calc(100dvh - ${controller.chromeHeight}px)` }}
    >
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-start gap-3 pb-[0.32rem]">
        <div />
        <h1 className="text-center text-xl font-semibold text-[#8FA8FF]">SpCoin Access Controller</h1>
        <div className="flex min-h-10 items-center justify-self-end gap-2">
          <OpenCloseBtn
            id="spCoinAccessManagerBackButton"
            onClick={controller.handleCloseAttempt}
            expandedTitle="Go Back"
            expandedAriaLabel="Go Back"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 w-full flex-col gap-6">
        <section className="min-h-0 flex-1 overflow-hidden">
          <div
            className={`flex h-full min-h-0 flex-1 overflow-hidden gap-6 ${
              expandedPanel ? 'flex-col' : 'flex-col md:flex-row'
            }`}
          >
            {showNpmPanel ? (
              <NpmAccessPanel
                cardClass={controller.cardClass}
                selectedPackage={controller.selectedPackage}
                availablePackages={controller.availablePackages}
                localInstallSourceRoot={controller.localInstallSourceRoot}
                localInstallSourceRootError={controller.localInstallSourceRootError}
                npmOtp={controller.npmOtp}
                versionInput={controller.versionInput}
                activeAction={controller.activeAction}
                uploadBlocked={controller.uploadBlocked}
                activeDownloadedVersion={controller.activeDownloadedVersion}
                downloadBlocked={controller.downloadBlocked}
                flashTarget={controller.flashTarget}
                selectedVersion={controller.selectedVersion}
                status={controller.status}
                isExpanded={expandedPanel === 'npm'}
                onToggleExpand={() =>
                  setExpandedPanel((current) => (current === 'npm' ? null : 'npm'))
                }
                onPackagePersist={controller.handlePackagePersist}
                onLocalInstallSourceRootChange={controller.setLocalInstallSourceRoot}
                onValidateLocalInstallSourceRoot={controller.validateLocalInstallSourceRoot}
                onNpmOtpChange={controller.setNpmOtp}
                onVersionInputChange={controller.handleVersionInputChange}
                onVersionPersist={controller.handleVersionPersist}
                onAdjustVersion={controller.adjustVersion}
                onRunManagerAction={controller.runManagerAction}
              />
            ) : null}

            {showDeploymentPanel ? (
              <DeploymentControllerPanel
                cardClass={controller.cardClass}
                deploymentName={controller.deploymentName}
                deploymentSymbol={controller.deploymentSymbol}
                deploymentDecimals={controller.deploymentDecimals}
                deploymentVersion={controller.deploymentVersion}
                deploymentSignerSource={controller.deploymentSignerSource}
                hardhatDeploymentAccountNumber={controller.hardhatDeploymentAccountNumber}
                canIncrementHardhatDeploymentAccountNumber={controller.canIncrementHardhatDeploymentAccountNumber}
                canDecrementHardhatDeploymentAccountNumber={controller.canDecrementHardhatDeploymentAccountNumber}
                deploymentChainName={controller.deploymentChainName}
                deploymentChainId={controller.deploymentChainId}
                deploymentPathDisplayValue={controller.deploymentPathDisplayValue}
                selectedSignerAddress={controller.selectedSignerAddress}
                showDeploymentAccountDetails={controller.showDeploymentAccountDetails}
                onToggleDeploymentAccountDetails={() =>
                  controller.setShowDeploymentAccountDetails((current) => !current)
                }
                deploymentAccountMetadata={controller.deploymentAccountMetadata}
                deploymentFlashError={controller.deploymentFlashError}
                deploymentPrivateKey={controller.deploymentPrivateKey}
                deploymentKeyRequiredMessage={controller.deploymentKeyRequiredMessage}
                deploymentVersionPrefix={controller.deploymentVersionPrefix}
                deployedContractAddress={controller.deployedContractAddressDisplay}
                showDeployedSignerDetails={controller.showDeployedSignerDetails}
                onToggleDeployedSignerDetails={() =>
                  controller.setShowDeployedSignerDetails((current) => !current)
                }
                deployedSignerAddress={controller.deployedSignerAddress}
                deployedSignerMetadata={controller.deployedSignerMetadata}
                deploymentStatus={controller.deploymentStatus}
                deploymentStatusIsError={controller.deploymentStatusIsError}
                deployDisableReason={controller.deployDisableReason}
                deployButtonLabel={controller.deployButtonLabel}
                isExpanded={expandedPanel === 'deploy'}
                onToggleExpand={() =>
                  setExpandedPanel((current) => (current === 'deploy' ? null : 'deploy'))
                }
                onSetDeploymentSignerSource={controller.setDeploymentSignerSource}
                onDeploymentSignerAddressChange={controller.setDeploymentSignerAddressInput}
                onDeploymentDecimalsChange={controller.handleDeploymentDecimalsInputChange}
                onAdjustDeploymentDecimals={controller.adjustDeploymentDecimals}
                onDeploymentVersionChange={controller.handleDeploymentVersionInputChange}
                onAdjustDeploymentVersion={controller.adjustDeploymentVersion}
                onHardhatDeploymentAccountNumberChange={controller.handleHardhatDeploymentAccountNumberChange}
                onAdjustHardhatDeploymentAccountNumber={controller.adjustHardhatDeploymentAccountNumber}
                onLocalSourceDeploymentPathChange={controller.setLocalSourceDeploymentPath}
                onDeploy={controller.handleDeploy}
                onDeploymentPrivateKeyChange={controller.handleDeploymentPrivateKeyChange}
                onDeploymentPrivateKeyBlur={controller.handleDeploymentPrivateKeyBlur}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

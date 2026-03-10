// File: app/(menu)/(dynamic)/SpCoinAccessController/page.tsx
'use client';

import React from 'react';
import CloseButton from '@/components/views/Buttons/CloseButton';
import { normalizeProjectRelativePath } from './helpers';
import NpmAccessPanel from './components/NpmAccessPanel';
import DeploymentControllerPanel from './components/DeploymentControllerPanel';
import { useSpCoinAccessController } from './hooks/useSpCoinAccessController';

export default function SpCoinAccessControllerPage() {
  const controller = useSpCoinAccessController();

  return (
    <main
      className="relative box-border flex w-full flex-col overflow-hidden bg-[#0B1020] px-6 pt-6 text-white"
      style={{ height: `calc(100dvh - ${controller.chromeHeight}px)` }}
    >
      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center">
        <div />
        <h1 className="text-center text-2xl font-bold text-[#5981F3]">SpCoin Access Controller</h1>
        <div className="flex items-center justify-self-end gap-2">
          <CloseButton
            id="spCoinAccessManagerBackButton"
            closeCallback={controller.handleCloseAttempt}
            title="Go Back"
            ariaLabel="Go Back"
            className="h-10 w-10 rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] flex items-center justify-center transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 w-full flex-col gap-6">
        <section className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 flex-1 overflow-hidden flex-col gap-6 md:flex-row">
            <NpmAccessPanel
              cardClass={controller.cardClass}
              selectedPackage={controller.selectedPackage}
              availablePackages={controller.availablePackages}
              useLocalPackage={controller.managerSettings.useLocalPackage}
              localInstallSourceRoot={controller.localInstallSourceRoot}
              localInstallSourceRootError={controller.localInstallSourceRootError}
              versionInput={controller.versionInput}
              activeAction={controller.activeAction}
              uploadBlocked={controller.uploadBlocked}
              downloadBlocked={controller.downloadBlocked}
              flashTarget={controller.flashTarget}
              selectedVersion={controller.selectedVersion}
              sourceRoot={controller.sourceRoot}
              status={controller.status}
              onPackagePersist={controller.handlePackagePersist}
              onPackageSourceModeChange={controller.handlePackageSourceModeChange}
              onLocalInstallSourceRootChange={controller.setLocalInstallSourceRoot}
              onValidateLocalInstallSourceRoot={controller.validateLocalInstallSourceRoot}
              onVersionInputChange={controller.handleVersionInputChange}
              onVersionPersist={controller.handleVersionPersist}
              onAdjustVersion={controller.adjustVersion}
              onRunManagerAction={controller.runManagerAction}
              onSourceRootChange={controller.setSourceRoot}
              onSourceRootBlurNormalize={(value) =>
                controller.setSourceRoot(
                  normalizeProjectRelativePath(
                    value,
                    controller.managerSettings.useLocalPackage
                      ? '/spCoinAccess'
                      : '/node_modules/@sponsorcoin/spcoin-access-modules',
                  ),
                )
              }
            />

            <DeploymentControllerPanel
              cardClass={controller.cardClass}
              deploymentMode={controller.deploymentMode}
              deploymentName={controller.deploymentName}
              deploymentSymbol={controller.deploymentSymbol}
              deploymentDecimals={controller.deploymentDecimals}
              deploymentVersion={controller.deploymentVersion}
              hardhatDeploymentAccountNumber={controller.hardhatDeploymentAccountNumber}
              canIncrementHardhatDeploymentAccountNumber={controller.canIncrementHardhatDeploymentAccountNumber}
              canDecrementHardhatDeploymentAccountNumber={controller.canDecrementHardhatDeploymentAccountNumber}
              deploymentChainName={controller.deploymentChainName}
              deploymentChainId={controller.deploymentChainId}
              deploymentPathDisplayValue={controller.deploymentPathDisplayValue}
              deploymentFlashError={controller.deploymentFlashError}
              deploymentAccountPrivateKey={controller.deploymentAccountPrivateKey}
              deploymentKeyRequiredMessage={controller.deploymentKeyRequiredMessage}
              deploymentVersionPrefix={controller.deploymentVersionPrefix}
              deploymentPublicKey={controller.deploymentPublicKeyDisplay}
              deploymentLogoPath={controller.deploymentLogoPath}
              deploymentStatus={controller.deploymentStatus}
              deploymentStatusIsError={controller.deploymentStatusIsError}
              deployDisableReason={controller.deployDisableReason}
              deployButtonLabel={controller.deployButtonLabel}
              onSetDeploymentMode={controller.setDeploymentMode}
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
              onDeploymentLogoPathChange={controller.setDeploymentLogoPath}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

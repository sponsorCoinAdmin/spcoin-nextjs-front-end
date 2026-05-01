'use client';

import React from 'react';
import OpenCloseBtn from '@/components/views/Buttons/OpenCloseBtn';
import ContractNetworkCard from '../components/ContractNetworkCard';
import DeleteStepPopup from '../components/DeleteStepPopup';
import DiscardChangesPopup from '../components/DiscardChangesPopup';
import MethodsPanelCard from '../components/MethodsPanelCard';
import NetworkSignerCard from '../components/NetworkSignerCard';
import OutputResultsCard from '../components/OutputResultsCard';
import RunningMethodPopup from '../components/RunningMethodPopup';
import ValidationPopup from '../components/ValidationPopup';
import type { LabCardId } from './types';

type Props = {
  expandedCard: LabCardId | null;
  showCard: (cardId: LabCardId) => boolean;
  getCardClassName: (cardId: LabCardId, defaultClassName?: string) => string;
  toggleExpandedCard: (cardId: LabCardId) => void;
  methodsCardRef: React.RefObject<HTMLElement | null>;
  isDesktopSharedLayout: boolean;
  sharedMethodsRowHeight: number | null;
  networkSignerCardProps: Omit<React.ComponentProps<typeof NetworkSignerCard>, 'className' | 'isExpanded' | 'onToggleExpand'>;
  contractNetworkCardProps: Omit<React.ComponentProps<typeof ContractNetworkCard>, 'className' | 'isExpanded' | 'onToggleExpand'>;
  methodsPanelCardProps: Omit<React.ComponentProps<typeof MethodsPanelCard>, 'articleClassName' | 'methodsCardRef' | 'isExpanded' | 'onToggleExpand'>;
  outputResultsCardProps: Omit<React.ComponentProps<typeof OutputResultsCard>, 'className' | 'style' | 'isExpanded' | 'onToggleExpand'>;
  validationPopupFields: string[];
  validationPopupTitle: string;
  validationPopupMessage: string;
  buttonStyle: string;
  validationPopupConfirmLabel: string;
  validationPopupCancelLabel: string;
  clearValidationPopup: () => void;
  hasValidationConfirmAction: boolean;
  handleValidationConfirm: () => void;
  isDeleteStepPopupOpen: boolean;
  selectedScriptStep?: { name?: string } | null;
  setIsDeleteStepPopupOpen: (value: boolean) => void;
  handleConfirmDeleteSelectedScriptStep: () => void;
  isDiscardChangesPopupOpen: boolean;
  discardChangesMessage: string;
  clearDiscardChangesPopup: () => void;
  handleDiscardConfirm: () => void;
  runningMethodPopup: {
    isOpen: boolean;
    methodName: string;
    startedAt: number;
    isCancelling: boolean;
    onCancel: () => void;
  };
};

export default function SponsorCoinLabView({
  expandedCard,
  showCard,
  getCardClassName,
  toggleExpandedCard,
  methodsCardRef,
  isDesktopSharedLayout,
  sharedMethodsRowHeight,
  networkSignerCardProps,
  contractNetworkCardProps,
  methodsPanelCardProps,
  outputResultsCardProps,
  validationPopupFields,
  validationPopupTitle,
  validationPopupMessage,
  buttonStyle,
  validationPopupConfirmLabel,
  validationPopupCancelLabel,
  clearValidationPopup,
  hasValidationConfirmAction,
  handleValidationConfirm,
  isDeleteStepPopupOpen,
  selectedScriptStep,
  setIsDeleteStepPopupOpen,
  handleConfirmDeleteSelectedScriptStep,
  isDiscardChangesPopupOpen,
  discardChangesMessage,
  clearDiscardChangesPopup,
  handleDiscardConfirm,
  runningMethodPopup,
}: Props) {
  return (
    <main id="sponsorcoin-sandbox-root" className="min-h-screen bg-[#090C16] p-6 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col">
        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center">
          <div />
          <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">SponsorCoin SandBox</h2>
          <div className="flex items-center justify-self-end gap-2">
            <OpenCloseBtn
              id="sponsorCoinSandboxBackButton"
              onClick={() => {
                if (typeof window !== 'undefined') window.history.back();
              }}
              expandedTitle="Go Back"
              expandedAriaLabel="Go Back"
            />
          </div>
        </div>

        <section className={`grid grid-cols-1 gap-6 ${expandedCard ? '' : 'xl:grid-cols-2'}`}>
          {showCard('network') && (
            <NetworkSignerCard
              className={getCardClassName('network', expandedCard ? '' : 'xl:col-start-2 xl:row-start-1')}
              isExpanded={expandedCard === 'network'}
              onToggleExpand={() => toggleExpandedCard('network')}
              {...networkSignerCardProps}
            />
          )}

          {showCard('contract') && (
            <ContractNetworkCard
              className={getCardClassName('contract', expandedCard ? '' : 'xl:col-start-1 xl:row-start-1')}
              isExpanded={expandedCard === 'contract'}
              onToggleExpand={() => toggleExpandedCard('contract')}
              {...contractNetworkCardProps}
            />
          )}

          {showCard('methods') && (
            <MethodsPanelCard
              articleClassName={`${getCardClassName('methods', expandedCard ? '' : 'xl:col-start-1 xl:row-start-2')} self-start`}
              methodsCardRef={methodsCardRef}
              isExpanded={expandedCard === 'methods'}
              onToggleExpand={() => toggleExpandedCard('methods')}
              {...methodsPanelCardProps}
            />
          )}

          {showCard('output') && (
            <OutputResultsCard
              className={`${getCardClassName('output', expandedCard ? '' : 'xl:col-start-2 xl:row-start-2')} min-h-0 self-start overflow-hidden`}
              style={
                !expandedCard && isDesktopSharedLayout && sharedMethodsRowHeight
                  ? { height: `${sharedMethodsRowHeight}px` }
                  : undefined
              }
              isExpanded={expandedCard === 'output'}
              onToggleExpand={() => toggleExpandedCard('output')}
              {...outputResultsCardProps}
            />
          )}
        </section>
      </section>

      <ValidationPopup
        fields={validationPopupFields}
        title={validationPopupTitle}
        message={validationPopupMessage}
        buttonStyle={buttonStyle}
        confirmLabel={validationPopupConfirmLabel}
        cancelLabel={validationPopupCancelLabel}
        onClose={clearValidationPopup}
        onConfirm={hasValidationConfirmAction ? handleValidationConfirm : undefined}
      />

      <DeleteStepPopup
        isOpen={isDeleteStepPopupOpen && !!selectedScriptStep}
        stepName={selectedScriptStep?.name || ''}
        buttonStyle={buttonStyle}
        onCancel={() => setIsDeleteStepPopupOpen(false)}
        onConfirm={handleConfirmDeleteSelectedScriptStep}
      />

      <DiscardChangesPopup
        isOpen={isDiscardChangesPopupOpen}
        message={discardChangesMessage}
        onCancel={clearDiscardChangesPopup}
        onConfirm={handleDiscardConfirm}
      />

      <RunningMethodPopup {...runningMethodPopup} />
    </main>
  );
}

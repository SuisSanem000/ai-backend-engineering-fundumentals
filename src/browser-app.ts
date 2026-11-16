/**
 * Browser Bundle Entrypoint for GitHub Pages Deployment
 * 
 * Exposes the full TypeScript SmartContactService (Stages 1-5) directly
 * in the browser runtime so the live static release executes real backend logic
 * without requiring a remote Node/Bun server.
 */

import { SmartContactService } from '../projects/smart-contact-list/src/SmartContactService.ts';

const service = new SmartContactService();

/**
 * Seeds initial sample contacts into the in-browser service instance.
 */
async function init() {
  await service.ingestContact(
    'Met with Dr. Gordon Freeman from Black Mesa Anomalous Materials. Email: gordon.freeman@blackmesa.gov. ' +
    'Specializes in quantum displacement and resonance hazard mitigation.'
  );
  await service.ingestContact(
    'Conference sync with Sarah Connor at Cyberdyne Systems. Email: sarah@cyberdyne.com. ' +
    'Leading defense infrastructure and neural network safeguards.'
  );
}

const readyPromise = init();

declare global {
  interface Window {
    __smartContactApp: {
      ready: Promise<void>;
      ingestContact: (text: string) => ReturnType<SmartContactService['ingestContact']>;
      searchContacts: (query: string, topK?: number) => ReturnType<SmartContactService['searchContacts']>;
      executeAgentDirective: (directive: string) => ReturnType<SmartContactService['executeAgentDirective']>;
      approveOperation: (token: string) => ReturnType<SmartContactService['approveOperation']>;
      getTraceTree: () => ReturnType<SmartContactService['getTraceTree']>;
      getAllContacts: () => ReturnType<SmartContactService['getAllContacts']>;
    };
  }
}

window.__smartContactApp = {
  ready: readyPromise,
  ingestContact: (text: string) => service.ingestContact(text),
  searchContacts: (query: string, topK = 5) => service.searchContacts(query, topK),
  executeAgentDirective: (directive: string) => service.executeAgentDirective(directive),
  approveOperation: (token: string) => service.approveOperation(token),
  getTraceTree: () => service.getTraceTree(),
  getAllContacts: () => service.getAllContacts(),
};

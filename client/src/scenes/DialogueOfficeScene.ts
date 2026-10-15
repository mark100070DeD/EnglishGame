import { httpDialogueGateway } from '../api/dialogueApi';
import { getOffice, type OfficeDefinition } from '../content/offices';
import { Npc } from '../entities/Npc';
import { DialogueSession } from '../systems/dialogue/DialogueSession';
import { ChatPanel } from '../ui/chat/ChatPanel';
import { getUiRoot } from '../ui/dom';
import type { RoomDefinition } from '../world/RoomDefinition';
import { tileFeet } from '../world/tileCoords';
import { RoomScene } from './RoomScene';
import { SceneKeys } from './SceneKeys';
import type { DialogueOfficeSceneData } from './sceneData';

/**
 * One scene class for every office. What the office looks like, who sits there
 * and which dialogue mode it uses all come from the OfficeDefinition picked by officeId.
 */
export class DialogueOfficeScene extends RoomScene<DialogueOfficeSceneData> {
  private office!: OfficeDefinition;
  private chat: ChatPanel | null = null;

  constructor() {
    super(SceneKeys.DialogueOffice);
  }

  init(data: DialogueOfficeSceneData): void {
    this.office = getOffice(data.officeId);
  }

  protected getRoomDefinition(): RoomDefinition {
    return this.office.room;
  }

  protected override populate(): void {
    const { npc: npcDef, kind, title } = this.office;
    const feet = tileFeet(npcDef);
    const npc = new Npc(this, feet.x ?? 0, feet.y ?? 0, { id: npcDef.id, name: npcDef.name });

    // Lives as long as the player stays in the office; reopening the chat continues the same session.
    const session = new DialogueSession(
      { officeKind: kind, npcId: npcDef.id, npcName: npcDef.name },
      httpDialogueGateway,
    );

    this.hotspots.register({
      id: `npc:${npcDef.id}`,
      target: npc,
      label: npcDef.name,
      onActivate: () => {
        this.openChat(new ChatPanel(getUiRoot(), {
          title: npcDef.name,
          subtitle: title,
          session,
          onClose: () => this.closeChat(),
        }));
        void session.start();
      },
    });
  }

  protected override onShutdown(): void {
    this.chat?.destroy();
    this.chat = null;
    super.onShutdown();
  }

  private openChat(panel: ChatPanel): void {
    if (this.chat) return;
    this.setInteractionEnabled(false);
    this.chat = panel;
    panel.open();
  }

  private closeChat(): void {
    this.chat = null;
    this.setInteractionEnabled(true);
  }
}

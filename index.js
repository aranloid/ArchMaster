/**
 * /!\ This file is auto-generated.
 *
 * This is the entry point of your standalone application.
 *
 * There are multiple tags used by the editor to inject code automatically:
 *     - `wle:auto-imports:start` and `wle:auto-imports:end`: The list of import statements
 *     - `wle:auto-register:start` and `wle:auto-register:end`: The list of component to register
 */

/* wle:auto-imports:start */
import {AudioListener} from '@wonderlandengine/components';
import {Cursor} from '@wonderlandengine/components';
import {CursorTarget} from '@wonderlandengine/components';
import {FingerCursor} from '@wonderlandengine/components';
import {HandTracking} from '@wonderlandengine/components';
import {MouseLookComponent} from '@wonderlandengine/components';
import {PlayerHeight} from '@wonderlandengine/components';
import {TeleportComponent} from '@wonderlandengine/components';
import {VrModeActiveSwitch} from '@wonderlandengine/components';
import {BridgeBlock} from './bridge-block.js';
import {BuildPlacementController} from './build-placement-controller.js';
import {ButtonComponent} from './button.js';
import {ComponentSpawner} from './component-spawner.js';
import {FailureDetector} from './failure-detector.js';
import {GrabbableBridgeBlock} from './grabbable-bridge-block.js';
import {LoadDropper} from './load-dropper.js';
import {MaterialManager} from './material-manager.js';
import {SelectComponentButton} from './select-component-button.js';
import {SimulationController} from './simulation-controller.js';
import {StartTestButton} from './start-test-button.js';
import {UIManager} from './ui-manager.js';
/* wle:auto-imports:end */

export default function(engine) {
/* wle:auto-register:start */
engine.registerComponent(AudioListener);
engine.registerComponent(Cursor);
engine.registerComponent(CursorTarget);
engine.registerComponent(FingerCursor);
engine.registerComponent(HandTracking);
engine.registerComponent(MouseLookComponent);
engine.registerComponent(PlayerHeight);
engine.registerComponent(TeleportComponent);
engine.registerComponent(VrModeActiveSwitch);
engine.registerComponent(BridgeBlock);
engine.registerComponent(BuildPlacementController);
engine.registerComponent(ButtonComponent);
engine.registerComponent(ComponentSpawner);
engine.registerComponent(FailureDetector);
engine.registerComponent(GrabbableBridgeBlock);
engine.registerComponent(LoadDropper);
engine.registerComponent(MaterialManager);
engine.registerComponent(SelectComponentButton);
engine.registerComponent(SimulationController);
engine.registerComponent(StartTestButton);
engine.registerComponent(UIManager);
/* wle:auto-register:end */
}

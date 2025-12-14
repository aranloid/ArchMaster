import { Component, InputComponent } from '@wonderlandengine/api';
import { CursorTarget } from '@wonderlandengine/components';

/**
 * grabbable-bridge-block
 *
 * Attach to BUILD-phase bridge pieces (Beam_Build, Deck_Build, etc.).
 *
 * Behaviour:
 *  - Point at the block and press/hold trigger      -> block follows 3D cursor hit point
 *  - Release trigger                                -> block stops following and stays there
 *
 * Button index is hard-coded to 0 (trigger).
 */
const GRAB_BUTTON_INDEX = 0;

export class GrabbableBridgeBlock extends Component {
    static TypeName = 'grabbable-bridge-block';
    static Properties = {};   // <- no custom properties, so no "invalid property" errors

    init() {
        this.cursorTarget = null;      // CursorTarget on this block
        this.followObject = null;      // The hit object we follow (3DCursorHitRight)
        this.grabInput = null;         // InputComponent for the grabbing controller
        this.isGrabbed = false;
        this._wasButtonPressed = false;

        this._onDown = this._onDown.bind(this);
    }

    start() {
        // Ensure we have a CursorTarget so the cursor can send clicks
        this.cursorTarget =
            this.object.getComponent(CursorTarget) ||
            this.object.addComponent(CursorTarget);

        this.cursorTarget.onDown.add(this._onDown);

        console.log('GrabbableBridgeBlock: active on', this.object.name);
    }

    onDestroy() {
        if (this.cursorTarget) {
            this.cursorTarget.onDown.remove(this._onDown);
        }
    }

    /**
     * Called once when trigger is PRESSED while the cursor is on this block.
     * We start grabbing here.
     *
     * @param {*} _
     * @param {*} cursorComponent   The Cursor component (e.g. on CursorRight)
     */
    _onDown(_, cursorComponent) {
        // Get the hit object (3DCursorHitRight). If not set, we can't place correctly.
        const cursorHitObject = cursorComponent.cursorObject;
        if (!cursorHitObject) {
            console.warn(
                'GrabbableBridgeBlock: cursor.cursorObject is not set! ' +
                'Assign 3DCursorHitRight to the Cursor component on CursorRight.'
            );
            return;
        }

        // Get the InputComponent from the controller object to read button state
        const controllerObj = cursorComponent.object;
        const inputComp =
            controllerObj.getComponent(InputComponent) ||
            controllerObj.getComponent('input');

        if (!inputComp) {
            console.warn(
                'GrabbableBridgeBlock: No InputComponent found on controller object',
                controllerObj.name
            );
            return;
        }

        // Begin grab
        this.isGrabbed = true;
        this.followObject = cursorHitObject;
        this.grabInput = inputComp;
        this._wasButtonPressed = true; // onDown means it was pressed this frame

        console.log(
            'GrabbableBridgeBlock: START grab on',
            this.object.name,
            'following',
            this.followObject.name
        );

        // Snap immediately to the hit point
        const p = this.followObject.getTranslationWorld();
        const r = this.followObject.getRotationWorld();
        this.object.setTranslationWorld(p);
        this.object.setRotationWorld(r);
    }

    /**
     * While grabbed, follow the cursor hit point and watch the trigger state.
     */
    update(dt) {
        if (!this.isGrabbed || !this.followObject || !this.grabInput) return;

        // --- 1) Drop when grab button is released ---

        const xrSource = this.grabInput.xrInputSource;
        const gamepad = xrSource && xrSource.gamepad;
        const buttons = gamepad && gamepad.buttons;

        if (!buttons || GRAB_BUTTON_INDEX < 0 || GRAB_BUTTON_INDEX >= buttons.length) {
            // If we lost input info, just stop grabbing to avoid "stuck" behaviour
            this._stopGrab();
            return;
        }

        const pressed = !!buttons[GRAB_BUTTON_INDEX].pressed;

        // Detect release edge: was pressed last frame, now not pressed
        if (!pressed && this._wasButtonPressed) {
            console.log('GrabbableBridgeBlock: DROP on', this.object.name);
            this._stopGrab();
            return;
        }

        this._wasButtonPressed = pressed;

        // --- 2) While still held, follow the hit object (3DCursorHitRight) ---

        const p = this.followObject.getTranslationWorld();
        const r = this.followObject.getRotationWorld();

        this.object.setTranslationWorld(p);
        this.object.setRotationWorld(r);
    }

    _stopGrab() {
        this.isGrabbed = false;
        this.followObject = null;
        this.grabInput = null;
        this._wasButtonPressed = false;
    }
}
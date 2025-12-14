import { Component, Property } from '@wonderlandengine/api';
import { CursorTarget } from '@wonderlandengine/components';

/**
 * start-test-button
 *
 * Attach this to the same object that already has:
 *  - button (from button.js)
 *  - cursor-target (button.js will add it)
 *
 * When clicked, it asks ui-manager to start the simulation with a given load kind.
 */
export class StartTestButton extends Component {
    static TypeName = 'start-test-button';

    static Properties = {
        uiManagerObject: Property.object(),
        // "car", "truck", "plane", "passenger" etc. must match LoadDropper keys
        loadKind: Property.string('car')
    };

    init() {
        this.cursorTarget = null;
        this.uiManager = null;
        this._onClick = this._onClick.bind(this);
    }

    start() {
        // Find ui-manager on the assigned object
        if (this.uiManagerObject) {
            this.uiManager = this.uiManagerObject.getComponent('ui-manager');
        }
        if (!this.uiManager) {
            console.warn(
                'StartTestButton: ui-manager not found on uiManagerObject'
            );
        }

        // Use the existing CursorTarget (added by button.js), or add one if missing
        this.cursorTarget =
            this.object.getComponent(CursorTarget) ||
            this.object.addComponent(CursorTarget);

        if (!this.cursorTarget) {
            console.error('StartTestButton: Could not get or add CursorTarget');
            return;
        }

        // Register click handler
        this.cursorTarget.onClick.add(this._onClick);
    }

    onDeactivate() {
        if (this.cursorTarget) {
            this.cursorTarget.onClick.remove(this._onClick);
        }
    }

    _onClick(_, cursor) {
        if (!this.uiManager) {
            console.warn('StartTestButton: No ui-manager set, cannot start test');
            return;
        }

        console.log(
            'StartTestButton: Starting test with load kind:',
            this.loadKind
        );
        this.uiManager.startTest(this.loadKind);
    }
}

import { Component, Property } from '@wonderlandengine/api';
import { CursorTarget } from '@wonderlandengine/components';

/**
 * select-component-button
 *
 * Attach to a 3D button object (with:
 *  - collision
 *  - cursor-target
 *  - button
 * )
 *
 * When clicked, it:
 *  1) Tells ui-manager which component index is selected.
 *  2) Asks ui-manager to place that component via ComponentSpawner.
 */
export class SelectComponentButton extends Component {
    static TypeName = 'select-component-button';

    static Properties = {
        uiManagerObject: Property.object(),
        // Which prefab index to select (0,1,2,...)
        componentIndex: Property.int(0)
    };

    init() {
        this.uiManager = null;
        this.cursorTarget = null;
    }

    start() {
        // Grab ui-manager
        if (this.uiManagerObject) {
            this.uiManager = this.uiManagerObject.getComponent('ui-manager');
            if (!this.uiManager) {
                console.warn(
                    'SelectComponentButton: uiManagerObject has no ui-manager component'
                );
            }
        } else {
            console.warn('SelectComponentButton: uiManagerObject not assigned');
        }

        // Ensure we have a CursorTarget to receive clicks
        this.cursorTarget =
            this.object.getComponent(CursorTarget) ||
            this.object.addComponent(CursorTarget);

        // Subscribe to onClick
        this.cursorTarget.onClick.add(this._onClick.bind(this));
    }

    _onClick(_, cursor) {
        if (!this.uiManager) {
            console.warn(
                'SelectComponentButton: No ui-manager set, cannot select/place component'
            );
            return;
        }

        console.log(
            'SelectComponentButton: Selecting and placing component index',
            this.componentIndex
        );

        // 1) Change the selected index on the UI manager
        this.uiManager.selectComponent(this.componentIndex);

        // 2) Immediately place the selected component
        //    ComponentSpawner.placeBuild() will fall back to a default position
        //    if there is no ghost (typically [0, 2, 0] under BridgeRoot).
        this.uiManager.placeSelectedComponent();
    }
}

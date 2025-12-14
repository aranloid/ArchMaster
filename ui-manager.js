import { Component, Property } from '@wonderlandengine/api';
export class UIManager extends Component {
    static TypeName = 'ui-manager';

    static Properties = {
        spawner: Property.object(),
        simController: Property.object(),
        materialSelectionDefault: Property.string('concrete'),
        materialManagerObject: Property.object()
    };

    init() {
        this.spawnerComp = null;
        this.simControllerComp = null;
        this.materialManager = null;

        this.selectedComponentIndex = 0;
        this.selectedMaterial = 'concrete';

        this.currentGhost = null;
        this.lastPreviewPosition = null;
        this.lastPreviewRotation = null;
    }

    start() {
        if (this.spawner) {
            this.spawnerComp = this.spawner.getComponent('component-spawner');
            if (!this.spawnerComp) {
                console.warn('UIManager: No component-spawner found on spawner object');
            }
        } else {
            console.warn('UIManager: No spawner object assigned');
        }

        if (this.simController) {
            this.simControllerComp =
                this.simController.getComponent('simulation-controller');
            if (!this.simControllerComp) {
                console.warn(
                    'UIManager: No simulation-controller found on simController object'
                );
            }
        } else {
            console.warn('UIManager: No simController object assigned');
        }

        this.materialManager =
            this.materialManagerObject &&
            this.materialManagerObject.getComponent('material-manager');

        if (!this.materialManager) {
            console.warn(
                'UIManager: No material-manager found on materialManagerObject (materials will not be applied)'
            );
        }

        this.selectedMaterial = this.materialSelectionDefault || 'concrete';

        if (this.materialManager && this.selectedMaterial) {
            this.materialManager.selectMaterial(this.selectedMaterial);
        }

        console.log(
            `UIManager: Initialized on '${this.object.name}' with default material`,
            this.selectedMaterial
        );
    }

    /** Called by SelectComponentButton */
    selectComponent(index) {
        this.selectedComponentIndex = index;
        console.log(
            `UIManager[${this.object.name}]: Selected component index`,
            index
        );

        if (this.lastPreviewPosition) {
            this.previewSelectedComponent(
                this.lastPreviewPosition,
                this.lastPreviewRotation
            );
        }
    }

    /** Optional material selection UI */
    selectMaterial(name) {
        if (!name) return;

        this.selectedMaterial = name;

        if (this.materialManager) {
            this.materialManager.selectMaterial(name);
        }

        if (this.currentGhost && !this.currentGhost.isDestroyed && this.materialManager) {
            this.materialManager.applyMaterialToInstance(
                this.currentGhost,
                this.selectedMaterial,
                true
            );
        }

        console.log(`UIManager[${this.object.name}]: Selected material`, name);
    }

    /**
     * Show / move the ghost of the selected component.
     * Called from BuildPlacementController using the cursor hit pose.
     */
    previewSelectedComponent(position, rotation) {
        if (!this.spawnerComp) {
            console.warn('UIManager: No spawnerComp for previewSelectedComponent()');
            return;
        }

        if (!position && !this.lastPreviewPosition) {
            return;
        }

        const pos = position || this.lastPreviewPosition;
        const rot = rotation || this.lastPreviewRotation || [0, 0, 0, 1];

        this.lastPreviewPosition = pos;
        this.lastPreviewRotation = rot;

        if (!this.currentGhost || this.currentGhost.isDestroyed) {
            this.currentGhost = this.spawnerComp.spawnGhost(
                this.selectedComponentIndex,
                pos,
                rot
            );

            if (this.currentGhost && this.materialManager) {
                this.materialManager.applyMaterialToInstance(
                    this.currentGhost,
                    this.selectedMaterial,
                    true /* ghost */
                );
            }
        } else {
            this.currentGhost.setTranslationWorld(pos);
            this.currentGhost.setRotationWorld(rot);
        }
    }

    /**
     * Place a real build piece at the current ghost position.
     * Called from BuildPlacementController when the "place" button is pressed.
     */
    placeSelectedComponent() {
        if (!this.spawnerComp) {
            console.warn('UIManager: No spawnerComp for placeSelectedComponent()');
            return null;
        }

        const placedComponent = this.spawnerComp.placeBuild(
            this.selectedComponentIndex
        );

        if (placedComponent && this.materialManager) {
            this.materialManager.applyMaterialToInstance(
                placedComponent,
                this.selectedMaterial,
                false /* not ghost */
            );
        }

        if (placedComponent) {
            console.log(
                `UIManager[${this.object.name}]: Placed component index`,
                this.selectedComponentIndex,
                'with material',
                this.selectedMaterial
            );
        }

        return placedComponent;
    }

    /**
     * Clear ONLY the preview ghost. This does NOT delete built bridge pieces.
     */
    clearAllComponents() {
        if (this.spawnerComp && typeof this.spawnerComp.clearGhost === 'function') {
            this.spawnerComp.clearGhost();
        }

        if (this.currentGhost && !this.currentGhost.isDestroyed) {
            this.currentGhost.destroy();
        }
        this.currentGhost = null;
        this.lastPreviewPosition = null;
        this.lastPreviewRotation = null;

        console.log(`UIManager[${this.object.name}]: Cleared preview ghost`);
    }

    startTest(loadKind = 'car') {
        if (!this.simControllerComp) {
            console.warn('UIManager: No simControllerComp, cannot start test');
            return;
        }

        console.log(
            `UIManager[${this.object.name}]: Starting test with load:`,
            loadKind
        );
        this.simControllerComp.startSimulation(loadKind);
    }
}


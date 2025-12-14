import { Component, Property } from '@wonderlandengine/api';


export class SimulationController extends Component {
    static TypeName = 'simulation-controller';

    static Properties = {
        spawnerObject: Property.object(),
        bridgeRoot: Property.object(),
        dropperObject: Property.object(),
        settleDelay: Property.float(0.3),
        checkDuration: Property.float(8.0),
        failureDetector: Property.object()
    };

    init() {
        this.isRunning = false;
        this.startTime = 0;
        this.testLoad = null;
        this.initialComponentCount = 0;
    }

    start() {
        // Nothing special yet
    }

    /**
     * Start the simulation with a given load kind:
     *   "car", "truck", "plane", etc.
     */
    async startSimulation(selectedLoadKind = 'car') {
        if (this.isRunning) {
            console.warn('SimulationController: Simulation already running');
            return;
        }

        if (!this.bridgeRoot) {
            console.error('SimulationController: No bridgeRoot assigned');
            return;
        }

        try {
            const spawner = this.spawnerObject
                ? this.spawnerObject.getComponent('component-spawner')
                : null;

            if (!spawner) {
                console.error('SimulationController: No component-spawner found on spawnerObject');
                return;
            }

            console.log('SimulationController: Starting simulation with load', selectedLoadKind);

            // Snapshot how many components we start with
            const count = this.bridgeRoot.childrenCount;
            const childrenAtStart = count > 0 ? new Array(count) : [];
            if (count > 0) {
                this.bridgeRoot.getChildren(childrenAtStart);
            }
            this.initialComponentCount = childrenAtStart.length;

            if (this.initialComponentCount === 0) {
                console.warn('SimulationController: No bridge components to test!');
                return;
            }

            console.log(
                'SimulationController: Testing bridge with ' +
                this.initialComponentCount +
                ' components'
            );

            // Replace build variants with runtime variants
            let replacedCount = 0;

            for (const child of childrenAtStart) {
                if (!child || child.isDestroyed) continue;
                const ud = child.userData || {};
                if (typeof ud.buildIndex === 'undefined') continue;

                const idx = ud.buildIndex;
                const runtimeTemplate = spawner.getRuntimeTemplate(idx);
                if (!runtimeTemplate) continue;

                const pos = child.getTranslationWorld();
                const rot = child.getRotationWorld();

                // Clone runtime version under bridgeRoot
                const runtimeInstance = runtimeTemplate.clone(this.bridgeRoot);
                runtimeInstance.setTranslationWorld(pos);
                runtimeInstance.setRotationWorld(rot);
                runtimeInstance.active = true;

                runtimeInstance.userData = { ...ud };

                // Remove build instance
                child.destroy();
                replacedCount++;
            }

            console.log(
                'SimulationController: Replaced ' +
                replacedCount +
                ' build components with runtime variants'
            );

            // Optionally, let FailureDetector rescan after replacement
            if (this.failureDetector) {
                const fd = this.failureDetector.getComponent('failure-detector');
                if (fd && typeof fd.collectTargetsNow === 'function') {
                    fd.collectTargetsNow();
                }
            }

            // Wait for physics to settle a bit before dropping the load
            await new Promise(function (resolve) {
                setTimeout(resolve, this.settleDelay * 1000);
            }.bind(this));

            // Drop the test load
            const dropper = this.dropperObject
                ? this.dropperObject.getComponent('load-dropper')
                : null;

            if (dropper) {
                this.testLoad = dropper.dropLoad(selectedLoadKind);
                console.log('SimulationController: Dropped ' + selectedLoadKind + ' load');
            } else {
                console.warn('SimulationController: No load-dropper component found');
            }

            this.isRunning = true;
            this.startTime = Date.now();

            console.log('SimulationController: Simulation started successfully');
        } catch (e) {
            console.error('SimulationController: Failed to start simulation', e);
        }
    }

    update(dt) {
        if (!this.isRunning) return;

        const elapsedTime = (Date.now() - this.startTime) / 1000.0;

        // Early complete collapse check
        if (this.isBridgeCompletelyCollapsed()) {
            console.log(
                'SimulationController: Early failure detected - bridge completely collapsed'
            );
            this.isRunning = false;
            this.evaluateResults();
            return;
        }

        // Time-based end of simulation
        if (elapsedTime > this.checkDuration) {
            this.isRunning = false;
            console.log(
                'SimulationController: Simulation complete - checking bridge integrity'
            );
            this.evaluateResults();
        }
    }

    /**
     * Returns true if no component is still standing above a collapse height.
     */
    isBridgeCompletelyCollapsed() {
        if (!this.bridgeRoot) return true;

        const count = this.bridgeRoot.childrenCount;
        if (count === 0) return true;
        const children = new Array(count);
        this.bridgeRoot.getChildren(children);

        const collapseHeight = -5.0;
        let standingComponents = 0;

        for (const child of children) {
            if (!child || child.isDestroyed) continue;
            const pos = child.getTranslationWorld();
            if (pos[1] > collapseHeight) {
                standingComponents++;
            }
        }

        return standingComponents === 0;
    }

    evaluateResults() {
        if (!this.bridgeRoot) {
            console.log('SimulationController: BRIDGE FAILURE - No bridge root found');
            this.triggerFailureEffects();
            return;
        }

        const count = this.bridgeRoot.childrenCount;
        const children = count > 0 ? new Array(count) : [];
        if (count > 0) {
            this.bridgeRoot.getChildren(children);
        }
        const remainingComponents = children.length;
        const survivalRate =
            this.initialComponentCount > 0
                ? remainingComponents / this.initialComponentCount
                : 0;

        console.log(
            'SimulationController: ' +
            remainingComponents +
            '/' +
            this.initialComponentCount +
            ' components survived (' +
            Math.round(survivalRate * 100) +
            '%)'
        );

        // Success tiers by survival rate
        if (survivalRate >= 0.8) {
            console.log('SimulationController: EXCELLENT SUCCESS - Bridge held strong!');
            this.triggerExcellentSuccessEffects();
        } else if (survivalRate >= 0.6) {
            console.log('SimulationController: GOOD SUCCESS - Bridge held well!');
            this.triggerGoodSuccessEffects();
        } else if (survivalRate >= 0.4) {
            console.log('SimulationController: PARTIAL SUCCESS - Bridge damaged but functional');
            this.triggerPartialSuccessEffects();
        } else if (survivalRate >= 0.2) {
            console.log('SimulationController: POOR PERFORMANCE - Bridge severely damaged');
            this.triggerPoorPerformanceEffects();
        } else {
            console.log('SimulationController: COMPLETE FAILURE - Bridge collapsed!');
            this.triggerFailureEffects();
        }

        this.logBridgeStatus();
    }

    logBridgeStatus() {
        if (!this.bridgeRoot) return;

        const componentTypes = {};
        const count = this.bridgeRoot.childrenCount;
        const children = count > 0 ? new Array(count) : [];
        if (count > 0) {
            this.bridgeRoot.getChildren(children);
        }
        for (const child of children) {
            if (!child || child.isDestroyed) continue;
            const type = (child.userData && child.userData.componentType) || 'Unknown';
            componentTypes[type] = (componentTypes[type] || 0) + 1;
        }

        console.log('SimulationController: Remaining components by type:', componentTypes);
    }

    triggerExcellentSuccessEffects() {
        // TODO: Hook up VFX / SFX / UI animations for excellent result
    }

    triggerGoodSuccessEffects() {
        // TODO: Hook up VFX / SFX / UI animations for good result
    }

    triggerPartialSuccessEffects() {
        // TODO: Hook up VFX / SFX / UI animations for partial success
    }

    triggerPoorPerformanceEffects() {
        // TODO: Hook up VFX / SFX / UI animations for poor performance
    }

    triggerFailureEffects() {
        // TODO: Hook up VFX / SFX / UI animations for complete failure
    }

    stopSimulation() {
        this.isRunning = false;
        console.log('SimulationController: Simulation stopped manually');
    }

    /** Utility for debug panels / UI */
    getSimulationStatus() {
        return {
            isRunning: this.isRunning,
            elapsedTime: this.isRunning
                ? (Date.now() - this.startTime) / 1000.0
                : 0,
            remainingComponents: (() => {
                if (!this.bridgeRoot) return 0;
                const count = this.bridgeRoot.childrenCount;
                return count || 0;
            })(),
            initialComponents: this.initialComponentCount
        };
    }
}



import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'loading',
    template: `		<div id="pause" class="d-flex align-items-center justify-content-center">
									<div id="spinner"></div>
								</div>`,
    changeDetection: ChangeDetectionStrategy.Eager
})

export class LoadingComponent {

}

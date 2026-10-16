import { Component, input } from '@angular/core';

export type IconName =
  | 'bell'
  | 'book'
  | 'chart'
  | 'check'
  | 'edit'
  | 'edit-simple'
  | 'eye'
  | 'grade'
  | 'groups'
  | 'logout'
  | 'refresh'
  | 'school'
  | 'search'
  | 'students'
  | 'teachers'
  | 'trash';

@Component({
  selector: 'app-ui-icon',
  templateUrl: './ui-icon.html',
  styles: ':host { display: inline-flex; flex: 0 0 auto; line-height: 0; }',
})
export class UiIcon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}

import { Component, input } from '@angular/core';

export type IconName =
  | 'bell'
  | 'book'
  | 'calendar'
  | 'chart'
  | 'check'
  | 'edit'
  | 'eye'
  | 'groups'
  | 'logout'
  | 'plus'
  | 'refresh'
  | 'school'
  | 'search'
  | 'students'
  | 'teachers'
  | 'trash'
  | 'user-plus';

@Component({
  selector: 'app-ui-icon',
  templateUrl: './ui-icon.html',
  styleUrl: './ui-icon.scss',
})
export class UiIcon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}

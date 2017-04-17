/**
 * Component definition for the frost-chart-x-axis component
 */

import Ember from 'ember'
const {A, Object: EmberObject, String: EmberString, get} = Ember
import {PropTypes} from 'ember-prop-types'
import computed, {readOnly} from 'ember-computed-decorators'
import {Component} from 'ember-frost-core'

import layout from '../templates/components/frost-chart-axis'

export default Component.extend({
  // == Dependencies ==========================================================

  // == Keyword Properties ====================================================

  attributeBindings: ['style'],
  classNameBindings: ['align'],
  layout,

  // == PropTypes =============================================================

  propTypes: {
    // options
    label: PropTypes.string,
    ticks: PropTypes.number

    // state
  },

  getDefaultProps () {
    return {
      // options
      ticks: 10,

      // state
      _isVertical: false,
      _renderedTicks: A()
    }
  },

  // == Computed Properties ===================================================

  @readOnly
  @computed('initializedChart', 'domain')
  _ticks (initializedChart, domain) {
    if (!initializedChart) {
      return []
    }

    const ticks = this.get('ticks')

    // We want ticks at the min/max of the domain, the rest of the ticks
    // should be divided evenly across the domain
    const _ticks = A()
    _ticks.addObject(EmberObject.create({
      value: domain[0]
    }))

    _ticks.addObjects(Array.from({length: ticks - 1}, (entry, index) => {
      const percentage = (index + 1) / ticks
      const tick = (domain[1] - domain[0]) * percentage + domain[0]
      return EmberObject.create({
        value: tick
      })
    }))

    _ticks.addObject(EmberObject.create({
      value: domain[1]
    }))

    return _ticks
  },

  @readOnly
  @computed('chartPadding', 'chartWidth', 'gutter')
  style (chartPadding, chartWidth, gutter) {
    const _gutter = gutter ? gutter.width : 0
    const _gutterAlign = gutter ? gutter.align : 'left'
    const padding = chartPadding ? get(chartPadding, this.get('align')) : 0
    return EmberString.htmlSafe(`
      ${this.get('align')}: ${padding}px;
      width: calc(${chartWidth}px - ${_gutter}px - ${this.get('_renderedTicks.lastObject.width')}px / 2);
      margin-${_gutterAlign}: ${_gutter}px;
      margin-right: calc(${this.get('_renderedTicks.lastObject.width')}px / 2);
    `)
  },

  // == Functions =============================================================

  // == DOM Events ============================================================

  // == Lifecycle Hooks =======================================================

  didReceiveAttrs ({newAttrs}) {
    const range = get(newAttrs, 'range.value')
    if (range) {
      const domain = this.get('domain')
      const scale = this.get('scale')
      const transform = scale({domain, range})

      const _ticks = this.get('_ticks')
      _ticks.forEach((_tick) => {
        _tick.set('coordinate', transform(get(_tick, 'value')))
      })
    }
  },

  init () {
    this._super(...arguments)
    this.register({
      ticks: this.get('ticks'),
      vertical: false
    })
  },

  // == Actions ===============================================================

  actions: {
    _didRenderTick ({height, width}) {
      const _renderedTicks = this.get('_renderedTicks').addObject({height, width})
      if (_renderedTicks.length === this.get('ticks') + 1) {
        const firstTick = _renderedTicks.get('firstObject')
        const lastTick = _renderedTicks.get('lastObject')
        const tickMargin = get(firstTick, 'width') / 2 + get(lastTick, 'width') / 2
        this.set('_tickHeight', this.$('.frost-chart-x-axis-ticks').height())
        this.didRenderAxis({
          align: this.get('align'),
          height: this.$().outerHeight(true),
          margin: tickMargin,
          width: this.$().outerWidth(true) - tickMargin
        })
      } else {
        this.set('_renderedTicks', _renderedTicks)
      }
    }
  }
})

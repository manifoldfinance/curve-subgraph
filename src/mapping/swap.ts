import { integer } from '@protofire/subgraph-toolkit'

import {
  AddLiquidity,
  NewAdmin,
  NewParameters,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  TokenExchange as TokenExchangeEvent,
  TokenExchangeUnderlying as TokenExchangeUnderlyingEvent,
} from '../../generated/Curve/StableSwap'

import {
  AddLiquidityEvent,
  AdminFeeChangelog,
  AmplificationCoeffChangelog,
  FeeChangeChangelog,
  RemoveLiquidityEvent,
  TokenExchange,
  TransferOwnershipEvent,
  UnderlyingTokenExchange,
} from '../../generated/schema'

import { getBalances, getOrCreatePool, getSystemInfo, toFeeDecimal } from '../entities'

export function handleAddLiquidity(event: AddLiquidity): void {
  let pool = getOrCreatePool(event.address, event.block, event.transaction)
  pool.balances = getBalances(event.address, pool.coinCount)

  pool.save()

  // Register liquidity event
  let log = new AddLiquidityEvent(
    'add_liquidity' + event.transaction.hash.toHexString() + '-' + event.logType.toString(),
  )

  log.pool = pool.id
  log.provider = event.params.provider
  log.tokenAmounts = event.params.token_amounts
  log.fees = event.params.fees
  log.invariant = event.params.invariant
  log.tokenSupply = event.params.token_supply

  log.block = event.block.number
  log.timestamp = event.block.timestamp
  log.transaction = event.transaction.hash

  log.save()
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let pool = getOrCreatePool(event.address, event.block, event.transaction)
  pool.balances = getBalances(event.address, pool.coinCount)

  pool.save()

  // Register liquidity event
  let log = new RemoveLiquidityEvent(
    'remove_liquidity' + event.transaction.hash.toHexString() + '-' + event.logType.toString(),
  )

  log.pool = pool.id
  log.provider = event.params.provider
  log.tokenAmounts = event.params.token_amounts
  log.fees = event.params.fees
  log.tokenSupply = event.params.token_supply

  log.block = event.block.number
  log.timestamp = event.block.timestamp
  log.transaction = event.transaction.hash

  log.save()
}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {
  let pool = getOrCreatePool(event.address, event.block, event.transaction)
  pool.balances = getBalances(event.address, pool.coinCount)

  pool.save()

  // Register liquidity event
  let log = new RemoveLiquidityEvent(
    'remove_liquidity_imbalance-' + event.transaction.hash.toHexString() + '-' + event.logType.toString(),
  )

  log.pool = pool.id
  log.provider = event.params.provider
  log.tokenAmounts = event.params.token_amounts
  log.fees = event.params.fees
  log.invariant = event.params.invariant
  log.tokenSupply = event.params.token_supply

  log.block = event.block.number
  log.timestamp = event.block.timestamp
  log.transaction = event.transaction.hash

  log.save()
}

export function handleNewAdmin(event: NewAdmin): void {
  let pool = getOrCreatePool(event.address, event.block, event.transaction)
  pool.owner = event.params.admin

  pool.save()

  // Register changelog
  let log = new TransferOwnershipEvent(
    'transfer-' + event.transaction.hash.toHexString() + '-' + event.logType.toString(),
  )

  log.pool = pool.id
  log.newAdmin = event.params.admin

  log.block = event.block.number
  log.timestamp = event.block.timestamp
  log.transaction = event.transaction.hash

  log.save()
}

export function handleNewParameters(event: NewParameters): void {
  let pool = getOrCreatePool(event.address, event.block, event.transaction)

  let newFee = toFeeDecimal(event.params.fee)
  let newAdminFee = toFeeDecimal(event.params.admin_fee)

  if (pool.A != event.params.A) {
    pool.A = event.params.A

    // Register changelog
    let log = new AmplificationCoeffChangelog(
      'A-' + event.transaction.hash.toHexString() + '-' + event.logType.toString(),
    )

    log.pool = pool.id
    log.value = event.params.A

    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash

    log.save()
  }

  if (pool.fee != newFee) {
    pool.fee = newFee

    // Register changelog
    let log = new FeeChangeChangelog('fee-' + event.transaction.hash.toHexString() + '-' + event.logType.toString())

    log.pool = pool.id
    log.value = newFee

    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash

    log.save()
  }

  if (pool.adminFee != newAdminFee) {
    pool.fee = newAdminFee

    // Register changelog
    let log = new AdminFeeChangelog(
      'admin_fee-' + event.transaction.hash.toHexString() + '-' + event.logType.toString(),
    )

    log.pool = pool.id
    log.value = newAdminFee

    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash

    log.save()
  }

  pool.save()
}

export function handleTokenExchange(event: TokenExchangeEvent): void {
  let pool = getOrCreatePool(event.address, event.block, event.transaction)

  if (pool != null) {
    let exchange = new TokenExchange(
      pool.id + '-c-' + event.params.sold_id.toString() + '-' + event.params.bought_id.toString(),
    )

    exchange.pool = pool.id
    exchange.buyer = event.params.buyer
    exchange.soldId = event.params.sold_id
    exchange.tokensSold = event.params.tokens_sold
    exchange.boughtId = event.params.bought_id
    exchange.tokensBought = event.params.tokens_bought

    exchange.block = event.block.number
    exchange.timestamp = event.block.timestamp
    exchange.transaction = event.transaction.hash

    exchange.save()

    let system = getSystemInfo(event.block, event.transaction)
    system.exchangeCount = system.exchangeCount.plus(integer.ONE)
    system.save()
  }
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlyingEvent): void {
  let pool = getOrCreatePool(event.address, event.block, event.transaction)

  if (pool != null) {
    let exchange = new UnderlyingTokenExchange(
      pool.id + '-u-' + event.params.sold_id.toString() + '-' + event.params.bought_id.toString(),
    )

    exchange.pool = pool.id
    exchange.buyer = event.params.buyer
    exchange.soldId = event.params.sold_id
    exchange.tokensSold = event.params.tokens_sold
    exchange.boughtId = event.params.bought_id
    exchange.tokensBought = event.params.tokens_bought

    exchange.block = event.block.number
    exchange.timestamp = event.block.timestamp
    exchange.transaction = event.transaction.hash

    exchange.save()

    let system = getSystemInfo(event.block, event.transaction)
    system.exchangeCount = system.exchangeCount.plus(integer.ONE)
    system.save()
  }
}

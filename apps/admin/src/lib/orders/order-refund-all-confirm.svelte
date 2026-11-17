<!-- Moving an order to `refunded` refunds whatever is left of its net value; say so before it happens. -->
<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { formatMoney } from '~/lib/format';
  import type { OrderDetail } from '~/lib/orders/types';
  import { orderStatusMeta } from '~/lib/orders/status';
  import { t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }

  let { order, open, onClose, onConfirm }: Props = $props();
</script>

<AlertDialog.Root {open} onOpenChange={(next) => !next && onClose()}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>
        {t('orders.actionsMarkAs', { status: orderStatusMeta('refunded').label })}
      </AlertDialog.Title>
      <AlertDialog.Description>
        {t('orders.refundAllDescription', {
          net: formatMoney(order.netTotal, order.totals.currency),
        })}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel variant="outline">{t('common.back')}</AlertDialog.Cancel>
      <AlertDialog.Action onclick={onConfirm}>{t('common.confirm')}</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

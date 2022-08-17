import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Icon } from "@calcom/ui";
import Avatar from "@calcom/ui/v2/core/Avatar";
import { Button } from "@calcom/ui/v2/core/Button";
import Loader from "@calcom/ui/v2/core/Loader";
import TimezoneSelect from "@calcom/ui/v2/core/TimezoneSelect";
import Select from "@calcom/ui/v2/core/form/Select";
import { TextField, Form, Label } from "@calcom/ui/v2/core/form/fields";
import { getLayout } from "@calcom/ui/v2/core/layouts/AdminLayout";
import showToast from "@calcom/ui/v2/core/notfications";

import { withQuery } from "@lib/QueryCell";
import { nameOfDay } from "@lib/core/i18n/weekday";

// TODO show toast

const WithQuery = withQuery(["viewer.public.i18n"], { context: { skipBatch: true } });

const GeneralQueryView = () => {
  const { t } = useLocale();

  return <WithQuery success={({ data }) => <GeneralView localeProp={data.locale} t={t} />} />;
};

function GeneralView({ localeProp, t }) {
  const router = useRouter();

  const { data: user, isLoading } = trpc.useQuery(["viewer.me"]);
  const { data: locale } = trpc.useQuery(["viewer.public.i18n"], { context: { skipBatch: true } });
  const mutation = trpc.useMutation("viewer.updateProfile", {
    onSuccess: () => {
      showToast("Profile updated successfully", "success");
    },
    onError: () => {
      showToast("Error updating profile", "error");
    },
  });

  const localeOptions = useMemo(() => {
    return (router.locales || []).map((locale) => ({
      value: locale,
      label: new Intl.DisplayNames(localeProp, { type: "language" }).of(locale) || "",
    }));
  }, [localeProp, router.locales]);

  const timeFormatOptions = [
    { value: 12, label: t("12_hour") },
    { value: 24, label: t("24_hour") },
  ];

  const weekStartOptions = [
    { value: "Sunday", label: nameOfDay(localeProp, 0) },
    { value: "Monday", label: nameOfDay(localeProp, 1) },
    { value: "Tuesday", label: nameOfDay(localeProp, 2) },
    { value: "Wednesday", label: nameOfDay(localeProp, 3) },
    { value: "Thursday", label: nameOfDay(localeProp, 4) },
    { value: "Friday", label: nameOfDay(localeProp, 5) },
    { value: "Saturday", label: nameOfDay(localeProp, 6) },
  ];

  const formMethods = useForm({
    defaultValues: {
      locale: {
        value: localeProp || "",
        label: localeOptions.find((option) => option.value === localeProp)?.label || "",
      },
      timeZone: user?.timeZone || "",
      timeFormat: {
        value: user?.timeFormat || 12,
        label: timeFormatOptions.find((option) => option.value === user?.timeFormat)?.label || 12,
      },
      weekStart: {
        value: user?.weekStart,
        label: nameOfDay(localeProp, user?.weekStart === "Sunday" ? 0 : 1),
      },
    },
  });

  if (isLoading) return <Loader />;

  return (
    <Form
      form={formMethods}
      handleSubmit={(values) => {
        mutation.mutate({
          ...values,
          locale: values.locale.value,
          timeFormat: values.timeFormat.value,
          weekStart: values.weekStart.value,
        });
      }}>
      <Controller
        name="locale"
        control={formMethods.control}
        render={({ field: { value } }) => (
          <>
            <Label className="text-gray-900">Language</Label>
            <Select
              options={localeOptions}
              value={value}
              onChange={(event) => {
                if (event) formMethods.setValue("locale", { ...event });
              }}
            />
          </>
        )}
      />
      <Controller
        name="timeZone"
        control={formMethods.control}
        render={({ field: { value } }) => (
          <>
            <Label className="text-gray-900">Timezone</Label>
            <TimezoneSelect
              id="timezone"
              value={value}
              onChange={(event) => {
                if (event) formMethods.setValue("timeZone", event.value);
              }}
            />
          </>
        )}
      />
      <Controller
        name="timeFormat"
        control={formMethods.control}
        render={({ field: { value } }) => (
          <>
            <Label className="text-gray-900">Time format</Label>
            <Select
              value={value}
              options={timeFormatOptions}
              onChange={(event) => {
                if (event) formMethods.setValue("timeFormat", { ...event });
              }}
            />
          </>
        )}
      />
      <Controller
        name="weekStart"
        control={formMethods.control}
        render={({ field: { value } }) => (
          <>
            <Label className="text-gray-900">Start of week</Label>
            <Select
              value={value}
              options={weekStartOptions}
              onChange={(event) => {
                if (event) formMethods.setValue("weekStart", { ...event });
              }}
            />
          </>
        )}
      />
      <Button color="primary" className="mt-8">
        Update
      </Button>
    </Form>
  );
}

GeneralQueryView.getLayout = getLayout;

export default GeneralQueryView;
